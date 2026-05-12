import { getAnimeDetail } from "@/services/anilist";
import { HiAnime } from "aniwatch";

export type StreamSourceType = "dummy" | "embed" | "hls";

export type StreamSource = {
  provider: "dummy" | "anipy" | "aniwatch";
  type: StreamSourceType;
  animeId: number;
  episode: number;
  title: string;
  url: string | null;
  poster: string | null;
  headers?: Record<string, string>;
  resolvedAnime?: {
    id: string;
    name: string;
  };
  subtitles: {
    label: string;
    src: string;
    language?: string;
  }[];
  notice?: string;
};

type AnipyStreamResponse = {
  url?: string;
  stream_url?: string;
  source?: string;
  sources?: {
    url?: string;
    file?: string;
    type?: string;
  }[];
  subtitles?: {
    label?: string;
    url?: string;
    src?: string;
    lang?: string;
  }[];
};

type AniwatchServer = "hd-1" | "hd-2" | "streamsb" | "streamtape";
type AniwatchCategory = "sub" | "dub" | "raw";

type HianimeMapperEpisode = {
  id?: string;
  episodeId?: string;
  number?: number;
};

type HianimeMapperResponse = {
  data?: {
    episodesList?: HianimeMapperEpisode[];
  };
  episodes?: HianimeMapperEpisode[];
};

function getTitle(data: Awaited<ReturnType<typeof getAnimeDetail>>) {
  const anime = data.Media;

  if (!anime) {
    return "Unknown Anime";
  }

  return anime.title.english || anime.title.romaji || anime.title.native;
}

function getCandidateTitles(data: Awaited<ReturnType<typeof getAnimeDetail>>) {
  const anime = data.Media;

  if (!anime) {
    return [];
  }

  return [
    anime.title.english,
    anime.title.romaji,
    anime.title.native,
  ].filter(Boolean) as string[];
}

function getPoster(data: Awaited<ReturnType<typeof getAnimeDetail>>) {
  const anime = data.Media;

  return anime?.bannerImage || anime?.coverImage.extraLarge || null;
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickBestAniwatchResult(
  results: HiAnime.Anime[],
  titles: string[]
) {
  const normalizedTitles = titles.map(normalizeTitle).filter(Boolean);
  const validResults = results.filter((anime) => anime.id && anime.name);

  return (
    validResults.find((anime) => {
      const name = normalizeTitle(anime.name || "");
      const jname = normalizeTitle(anime.jname || "");

      return normalizedTitles.some(
        (title) => name === title || jname === title
      );
    }) ||
    validResults.find((anime) => {
      const name = normalizeTitle(anime.name || "");
      const jname = normalizeTitle(anime.jname || "");

      return normalizedTitles.some(
        (title) => name.includes(title) || title.includes(name) || jname.includes(title)
      );
    }) ||
    validResults[0]
  );
}

function inferStreamType(url: string | null): StreamSourceType {
  if (!url) {
    return "dummy";
  }

  return url.includes(".m3u8") ? "hls" : "embed";
}

async function getDummyStream(animeId: number, episode: number): Promise<StreamSource> {
  const data = await getAnimeDetail(animeId);

  return {
    provider: "dummy",
    type: "dummy",
    animeId,
    episode,
    title: getTitle(data),
    url: null,
    poster: getPoster(data),
    subtitles: [],
    notice:
      "No free stream provider is configured yet. Set STREAM_PROVIDER=aniwatch to test the free HiAnime scraper provider.",
  };
}

async function getAnipyStream(animeId: number, episode: number): Promise<StreamSource> {
  const baseUrl = process.env.ANIPY_BASE_URL;

  if (!baseUrl) {
    return getDummyStream(animeId, episode);
  }

  const data = await getAnimeDetail(animeId);
  const endpoint = new URL(`/anime/${animeId}/episodes/${episode}/stream`, baseUrl);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      provider: "anipy",
      type: "dummy",
      animeId,
      episode,
      title: getTitle(data),
      url: null,
      poster: getPoster(data),
      subtitles: [],
      notice: `Anipy provider responded with ${response.status}. Check ANIPY_BASE_URL or endpoint mapping.`,
    };
  }

  const stream = (await response.json()) as AnipyStreamResponse;
  const url =
    stream.url ||
    stream.stream_url ||
    stream.source ||
    stream.sources?.find((source) => source.url || source.file)?.url ||
    stream.sources?.find((source) => source.url || source.file)?.file ||
    null;

  return {
    provider: "anipy",
    type: inferStreamType(url),
    animeId,
    episode,
    title: getTitle(data),
    url,
    poster: getPoster(data),
    subtitles:
      stream.subtitles?.map((subtitle) => ({
        label: subtitle.label || subtitle.lang || "Subtitle",
        src: subtitle.url || subtitle.src || "",
        language: subtitle.lang,
      })).filter((subtitle) => Boolean(subtitle.src)) || [],
  };
}

async function getMappedEpisodeId(animeId: number, episode: number) {
  const mapperUrl = process.env.HIANIME_MAPPER_URL;

  if (!mapperUrl) {
    return null;
  }

  const endpoint = new URL(`/anime/info/${animeId}`, mapperUrl);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`hianime-mapper responded with ${response.status}`);
  }

  const data = (await response.json()) as HianimeMapperResponse;
  const episodes = data.data?.episodesList || data.episodes || [];
  const mappedEpisode = episodes.find((item) => item.number === episode);

  return mappedEpisode?.id || mappedEpisode?.episodeId || null;
}

async function resolveAniwatchSources(episodeId: string) {
  const hianime = new HiAnime.Scraper();
  const categories: AniwatchCategory[] = ["sub", "dub", "raw"];
  const servers: AniwatchServer[] = ["hd-1", "hd-2", "streamsb", "streamtape"];
  const errors: string[] = [];

  for (const category of categories) {
    for (const server of servers) {
      try {
        const sources = await hianime.getEpisodeSources(
          episodeId,
          server,
          category
        );
        const source = sources.sources.find((item) => item.url);

        if (source?.url) {
          return {
            category,
            server,
            source,
            sources,
            errors,
          };
        }
      } catch (error) {
        errors.push(
          `${category}/${server}: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        );
      }
    }
  }

  return {
    category: null,
    server: null,
    source: null,
    sources: null,
    errors,
  };
}

async function getAniwatchStream(
  animeId: number,
  episode: number
): Promise<StreamSource> {
  const data = await getAnimeDetail(animeId);
  const title = getTitle(data);
  const titles = getCandidateTitles(data);
  const hianime = new HiAnime.Scraper();

  try {
    const mappedEpisodeId = await getMappedEpisodeId(animeId, episode);

    if (mappedEpisodeId) {
      const resolved = await resolveAniwatchSources(mappedEpisodeId);

      if (resolved.source?.url && resolved.sources) {
        return {
          provider: "aniwatch",
          type: resolved.source.isM3U8
            ? "hls"
            : inferStreamType(resolved.source.url),
          animeId,
          episode,
          title,
          url: resolved.source.url,
          poster: getPoster(data),
          headers: resolved.sources.headers,
          resolvedAnime: {
            id: mappedEpisodeId,
            name: title,
          },
          subtitles:
            resolved.sources.subtitles?.map((subtitle) => ({
              label: subtitle.lang,
              src: subtitle.url,
              language: subtitle.lang,
            })) || [],
          notice: `Resolved through hianime-mapper and aniwatch using ${resolved.category}/${resolved.server}.`,
        };
      }

      return {
        provider: "aniwatch",
        type: "dummy",
        animeId,
        episode,
        title,
        url: null,
        poster: getPoster(data),
        resolvedAnime: {
          id: mappedEpisodeId,
          name: title,
        },
        subtitles: [],
        notice: `hianime-mapper returned episode id "${mappedEpisodeId}", but aniwatch returned no playable source. Tried: ${resolved.errors.slice(0, 4).join("; ")}`,
      };
    }
  } catch (error) {
    return {
      provider: "aniwatch",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster: getPoster(data),
      subtitles: [],
      notice: `hianime-mapper failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    };
  }

  const search = await hianime.search(title, 1);
  const resolvedAnime = pickBestAniwatchResult(search.animes, titles);

  if (!resolvedAnime?.id) {
    return {
      provider: "aniwatch",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster: getPoster(data),
      subtitles: [],
      notice: `Aniwatch could not resolve "${title}" to a HiAnime id.`,
    };
  }

  const episodes = await hianime.getEpisodes(resolvedAnime.id);
  const resolvedEpisode = episodes.episodes.find(
    (item) => item.number === episode
  );

  if (!resolvedEpisode?.episodeId) {
    return {
      provider: "aniwatch",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster: getPoster(data),
      resolvedAnime: {
        id: resolvedAnime.id,
        name: resolvedAnime.name || title,
      },
      subtitles: [],
      notice: `Aniwatch resolved "${title}" to "${resolvedAnime.name}", but episode ${episode} was not found.`,
    };
  }

  const resolved = await resolveAniwatchSources(resolvedEpisode.episodeId);

  if (resolved.source?.url && resolved.sources) {
    return {
      provider: "aniwatch",
      type: resolved.source.isM3U8
        ? "hls"
        : inferStreamType(resolved.source.url),
      animeId,
      episode,
      title,
      url: resolved.source.url,
      poster: getPoster(data),
      headers: resolved.sources.headers,
      resolvedAnime: {
        id: resolvedAnime.id,
        name: resolvedAnime.name || title,
      },
      subtitles:
        resolved.sources.subtitles?.map((subtitle) => ({
          label: subtitle.lang,
          src: subtitle.url,
          language: subtitle.lang,
        })) || [],
      notice: `Resolved through aniwatch search using ${resolved.category}/${resolved.server}.`,
    };
  }

  return {
    provider: "aniwatch",
    type: "dummy",
    animeId,
    episode,
    title,
    url: null,
    poster: getPoster(data),
    resolvedAnime: {
      id: resolvedAnime.id,
      name: resolvedAnime.name || title,
    },
    subtitles: [],
    notice: `Aniwatch found the episode, but no playable source was returned. Tried: ${resolved.errors.slice(0, 4).join("; ")}`,
  };
}

export async function getStreamSource(
  animeId: number,
  episode: number,
  providerOverride?: string
): Promise<StreamSource> {
  const provider = providerOverride || process.env.STREAM_PROVIDER || "dummy";

  try {
    if (provider === "anipy") {
      return getAnipyStream(animeId, episode);
    }

    if (provider === "aniwatch") {
      return getAniwatchStream(animeId, episode);
    }
  } catch (error) {
    const fallback = await getDummyStream(animeId, episode);

    return {
      ...fallback,
      provider: provider === "aniwatch" ? "aniwatch" : "dummy",
      notice: `Stream provider failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    };
  }

  return getDummyStream(animeId, episode);
}
