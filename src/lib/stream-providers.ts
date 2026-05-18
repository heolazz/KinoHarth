import { getAnimeDetail } from "@/services/anilist";
import { HiAnime } from "aniwatch";

export type StreamSourceType = "dummy" | "embed" | "hls";

export type StreamOption = {
  url: string;
  type: Exclude<StreamSourceType, "dummy">;
  server: string;
  priority?: number;
  referer?: string;
};

export type StreamSource = {
  provider: "dummy" | "anipy" | "aniwatch" | "animepahe" | "miruro";
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
  streams?: StreamOption[];
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

type AnimepaheSearchItem = {
  session?: string;
  id?: string;
  title?: string;
  name?: string;
};

type AnimepaheSearchResponse = {
  data?: AnimepaheSearchItem[];
  results?: AnimepaheSearchItem[];
};

type AnimepaheRelease = {
  session?: string;
  episode?: number | string;
  episode2?: number | string;
  number?: number | string;
};

type AnimepaheReleasesResponse = {
  data?: AnimepaheRelease[];
  episodes?: AnimepaheRelease[];
  last_page?: number;
  lastPage?: number;
};

type AnimepahePlaySource = {
  url?: string;
  file?: string;
  quality?: string;
  resolution?: string;
  isM3U8?: boolean;
};

type AnimepaheSubtitle = {
  label?: string;
  url?: string;
  src?: string;
  lang?: string;
  language?: string;
};

type AnimepahePlayResponse = {
  sources?: AnimepahePlaySource[];
  source?: AnimepahePlaySource;
  downloads?: unknown[];
  subtitles?: AnimepaheSubtitle[];
};

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

function pickBestAnimepaheResult(
  results: AnimepaheSearchItem[],
  titles: string[]
) {
  const normalizedTitles = titles.map(normalizeTitle).filter(Boolean);
  const validResults = results.filter(
    (anime) => anime.session && (anime.title || anime.name)
  );

  return (
    validResults.find((anime) => {
      const title = normalizeTitle(anime.title || anime.name || "");

      return normalizedTitles.some((candidate) => title === candidate);
    }) ||
    validResults.find((anime) => {
      const title = normalizeTitle(anime.title || anime.name || "");

      return normalizedTitles.some(
        (candidate) => title.includes(candidate) || candidate.includes(title)
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

async function fetchAnimepaheJson<T>(path: string, baseUrl: string) {
  const endpoint = new URL(path, baseUrl);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`animepahe-api responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function getAnimepaheReleases(
  baseUrl: string,
  animeSession: string,
  episode: number
) {
  let page = 1;
  let lastPage = 1;

  do {
    const releases = await fetchAnimepaheJson<AnimepaheReleasesResponse>(
      `/api/${animeSession}/releases?sort=episode_asc&page=${page}`,
      baseUrl
    );
    const releaseList = releases.data || releases.episodes || [];
    const match = releaseList.find((release) => {
      const releaseNumber = release.episode || release.episode2 || release.number;

      return Number(releaseNumber) === episode;
    });

    if (match?.session) {
      return match.session;
    }

    lastPage = releases.last_page || releases.lastPage || lastPage;
    page += 1;
  } while (page <= lastPage && page <= 20);

  return null;
}

async function getAnimepaheStream(
  animeId: number,
  episode: number
): Promise<StreamSource> {
  const baseUrl = process.env.ANIMEPAHE_BASE_URL;

  if (!baseUrl) {
    const fallback = await getDummyStream(animeId, episode);

    return {
      ...fallback,
      provider: "animepahe",
      notice:
        "Set ANIMEPAHE_BASE_URL to your self-hosted animepahe-api instance before using the Animepahe provider.",
    };
  }

  const data = await getAnimeDetail(animeId);
  const title = getTitle(data);
  const titles = getCandidateTitles(data);
  const query = encodeURIComponent(titles[0] || title);
  const search = await fetchAnimepaheJson<AnimepaheSearchResponse>(
    `/api/search?q=${query}`,
    baseUrl
  );
  const resolvedAnime = pickBestAnimepaheResult(
    search.data || search.results || [],
    titles
  );

  if (!resolvedAnime?.session) {
    return {
      provider: "animepahe",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster: getPoster(data),
      subtitles: [],
      notice: `Animepahe could not resolve "${title}" from your animepahe-api search results.`,
    };
  }

  const episodeSession = await getAnimepaheReleases(
    baseUrl,
    resolvedAnime.session,
    episode
  );

  if (!episodeSession) {
    return {
      provider: "animepahe",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster: getPoster(data),
      resolvedAnime: {
        id: resolvedAnime.session,
        name: resolvedAnime.title || resolvedAnime.name || title,
      },
      subtitles: [],
      notice: `Animepahe resolved "${title}" to "${resolvedAnime.title || resolvedAnime.name}", but episode ${episode} was not found.`,
    };
  }

  const play = await fetchAnimepaheJson<AnimepahePlayResponse>(
    `/api/play/${resolvedAnime.session}?episodeId=${episodeSession}&downloads=false`,
    baseUrl
  );
  const sources = play.source ? [play.source, ...(play.sources || [])] : play.sources || [];
  const source = sources.find((item) => item.url || item.file);
  const url = source?.url || source?.file || null;

  return {
    provider: "animepahe",
    type: source?.isM3U8 || inferStreamType(url) === "hls" ? "hls" : inferStreamType(url),
    animeId,
    episode,
    title,
    url,
    poster: getPoster(data),
    resolvedAnime: {
      id: resolvedAnime.session,
      name: resolvedAnime.title || resolvedAnime.name || title,
    },
    subtitles:
      play.subtitles?.map((subtitle) => ({
        label: subtitle.label || subtitle.lang || subtitle.language || "Subtitle",
        src: subtitle.url || subtitle.src || "",
        language: subtitle.lang || subtitle.language,
      })).filter((subtitle) => Boolean(subtitle.src)) || [],
    notice: url
      ? `Resolved through Animepahe API as "${resolvedAnime.title || resolvedAnime.name || title}".`
      : "Animepahe API returned no playable HLS source for this episode.",
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
          `${category}/${server}: ${error instanceof Error ? error.message : "unknown error"
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
      notice: `hianime-mapper failed: ${error instanceof Error ? error.message : "unknown error"
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

type MiruroEpisodeItem = {
  id?: string;
  slug?: string;
  number?: number;
  episode?: number;
  title?: string;
  category?: string;
  provider?: string;
};

type MiruroEpisodesResponse = {
  success?: boolean;
  data?: {
    providers?: Record<string, {
      meta?: unknown;
      episodes?: {
        sub?: MiruroEpisodeItem[];
        dub?: MiruroEpisodeItem[];
        raw?: MiruroEpisodeItem[];
      };
    }>;
  };
};

type MiruroWatchStream = {
  url?: string;
  file?: string;
  src?: string;
  type?: string;
  isM3U8?: boolean;
  quality?: string;
  server?: string;
  priority?: number;
  referer?: string;
};

type MiruroSubtitle = {
  label?: string;
  lang?: string;
  language?: string;
  file?: string;
  url?: string;
  src?: string;
};

type MiruroWatchResponse = {
  success?: boolean;
  data?: {
    streams?: MiruroWatchStream[];
    download?: string;
    sources?: MiruroWatchStream[];
    source?: MiruroWatchStream;
    ssub?: {
      streams?: MiruroWatchStream[];
      subtitles?: MiruroSubtitle[];
    };
    dub?: {
      streams?: MiruroWatchStream[];
      subtitles?: MiruroSubtitle[];
    };
    raw?: {
      streams?: MiruroWatchStream[];
      subtitles?: MiruroSubtitle[];
    };
    subtitles?: MiruroSubtitle[];
    headers?: Record<string, string>;
  };
  sources?: MiruroWatchStream[];
  source?: MiruroWatchStream;
  subtitles?: MiruroSubtitle[];
  headers?: Record<string, string>;
};

async function fetchMiruroJson<T>(path: string, baseUrl: string) {
  const endpoint = new URL(path, baseUrl);

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Miruro API responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

function getMiruroEpisodes(json: MiruroEpisodesResponse): MiruroEpisodeItem[] {
  const episodes: MiruroEpisodeItem[] = [];

  if (json?.data?.providers) {
    const providers = json.data.providers;

    for (const key of Object.keys(providers)) {
      if (providers[key]?.episodes) {
        const sub = providers[key].episodes?.sub || [];
        const dub = providers[key].episodes?.dub || [];

        episodes.push(...sub.map((item) => ({ ...item, provider: key, category: "sub" })));
        episodes.push(...dub.map((item) => ({ ...item, provider: key, category: "dub" })));
      }
    }
  }

  return episodes;
}

function pickMiruroEpisode(
  episodes: MiruroEpisodeItem[],
  episodeNumber: number
) {
  const matchingEpisodes = episodes.filter((item) => {
    const number = item.number ?? item.episode;
    return Number(number) === episodeNumber;
  });

  const preferred = ["ally", "dune", "kiwi", "bee", "zoro", "allanime"];

  matchingEpisodes.sort((a, b) => {
    if (a.category === "sub" && b.category !== "sub") return -1;
    if (a.category !== "sub" && b.category === "sub") return 1;

    const indexA = preferred.indexOf(a.provider || "");
    const indexB = preferred.indexOf(b.provider || "");

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return 0;
  });

  return matchingEpisodes[0];
}

function getMiruroStreamUrl(stream: MiruroWatchStream) {
  return stream.url || stream.file || stream.src || null;
}

function getMiruroStreamType(
  stream: MiruroWatchStream,
  url: string
): Exclude<StreamSourceType, "dummy"> {
  return stream.type === "hls" || stream.isM3U8 || inferStreamType(url) === "hls"
    ? "hls"
    : "embed";
}

function sortMiruroStreams(streams: MiruroWatchStream[]) {
  return [...streams].sort((a, b) => {
    const priorityA = a.priority ?? Number.NEGATIVE_INFINITY;
    const priorityB = b.priority ?? Number.NEGATIVE_INFINITY;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    return 0;
  });
}

function getMiruroStreamOptions(streams: MiruroWatchStream[]): StreamOption[] {
  const seenUrls = new Set<string>();

  return sortMiruroStreams(streams)
    .flatMap((stream) => {
      const url = getMiruroStreamUrl(stream);

      if (!url || seenUrls.has(url)) {
        return [];
      }

      seenUrls.add(url);

      return [{
        url,
        type: getMiruroStreamType(stream, url),
        server: stream.server || stream.quality || "Unknown",
        priority: stream.priority,
        referer: stream.referer,
      }];
    });
}

function normalizeServerName(server: string | undefined) {
  return server?.trim().toLowerCase() || "";
}

function pickMiruroStream(
  streams: MiruroWatchStream[],
  preferredServer?: string
) {
  const validStreams = sortMiruroStreams(
    streams.filter((stream) => getMiruroStreamUrl(stream))
  );
  const selectedServer = normalizeServerName(preferredServer);

  return selectedServer
    ? validStreams.find(
        (stream) => normalizeServerName(stream.server) === selectedServer
      ) || validStreams[0] || null
    : validStreams[0] || null;
}

async function getMiruroStream(
  animeId: number,
  episode: number,
  streamServer?: string
): Promise<StreamSource> {
  const baseUrl = process.env.MIRURO_API_BASE_URL;

  if (!baseUrl) {
    const fallback = await getDummyStream(animeId, episode);

    return {
      ...fallback,
      provider: "miruro",
      notice: "Set MIRURO_API_BASE_URL before using Miruro provider.",
    };
  }

  const data = await getAnimeDetail(animeId);
  const title = getTitle(data);

  try {
    const episodesJson = await fetchMiruroJson<MiruroEpisodesResponse>(
      `/api/v2/miruro/episodes/${animeId}`,
      baseUrl
    );

    const episodes = getMiruroEpisodes(episodesJson);
    const resolvedEpisode = pickMiruroEpisode(episodes, episode);

    if (!resolvedEpisode) {
      return {
        provider: "miruro",
        type: "dummy",
        animeId,
        episode,
        title,
        url: null,
        poster: getPoster(data),
        subtitles: [],
        notice: `Miruro could not find episode ${episode} for AniList ID ${animeId}.`,
      };
    }

    const provider = resolvedEpisode.provider || "zoro";
    const category = resolvedEpisode.category || "sub";
    const watchPath = resolvedEpisode.id || resolvedEpisode.slug;

    if (!watchPath) {
      return {
        provider: "miruro",
        type: "dummy",
        animeId,
        episode,
        title,
        url: null,
        poster: getPoster(data),
        subtitles: [],
        notice: `Miruro found episode ${episode}, but no slug/id was returned.`,
      };
    }

    const endpointPath = watchPath.startsWith("watch/")
      ? `/api/v2/miruro/${watchPath}`
      : `/api/v2/miruro/watch/${provider}/${animeId}/${category}/${watchPath}`;

    const watchJson = await fetchMiruroJson<MiruroWatchResponse>(
      endpointPath,
      baseUrl
    );

    const streams = watchJson.data?.streams || [];

    const sourceList = [
      ...streams,
      ...(watchJson.data?.sources || []),
      ...(watchJson.data?.ssub?.streams || []),
      ...(watchJson.data?.dub?.streams || []),
      ...(watchJson.data?.raw?.streams || []),
      ...(watchJson.sources || []),
    ];

    if (watchJson.data?.source) sourceList.unshift(watchJson.data.source);
    if (watchJson.source) sourceList.unshift(watchJson.source);

    const stream = pickMiruroStream(sourceList, streamServer);
    const url = stream ? getMiruroStreamUrl(stream) : null;
    const streamOptions = getMiruroStreamOptions(sourceList);

    const subtitlesList = [
      ...(watchJson.data?.subtitles || []),
      ...(watchJson.data?.ssub?.subtitles || []),
      ...(watchJson.data?.dub?.subtitles || []),
      ...(watchJson.data?.raw?.subtitles || []),
      ...(watchJson.subtitles || []),
    ];

    const referer =
      stream?.referer ||
      watchJson.data?.ssub?.streams?.[0]?.referer ||
      watchJson.data?.sources?.[0]?.referer;
      
    const headers: Record<string, string> =
      watchJson.data?.headers || watchJson.headers || {};
      
    if (referer) headers["Referer"] = referer;

    return {
      provider: "miruro",
      type: stream?.type === "hls" || stream?.isM3U8 || inferStreamType(url) === "hls" 
        ? "hls" 
        : url 
          ? "embed" 
          : "dummy",
      animeId,
      episode,
      title,
      url,
      poster: getPoster(data),
      headers,
      resolvedAnime: {
        id: String(watchPath),
        name: title,
      },
      subtitles: subtitlesList
        .map((subtitle) => ({
          label: subtitle.label || subtitle.lang || subtitle.language || "Subtitle",
          src: subtitle.file || subtitle.url || subtitle.src || "",
          language: subtitle.language || subtitle.lang,
        }))
        .filter((subtitle) => Boolean(subtitle.src)),
      streams: streamOptions,
      notice: url
        ? `Resolved through Miruro ${provider}/${category} using ${stream?.server || "unknown"} server.`
        : `Miruro found episode ${episode}, but returned no playable stream.`,
    };
  } catch (error) {
    return {
      provider: "miruro",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster: getPoster(data),
      subtitles: [],
      notice: `Miruro API failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

export async function getStreamSource(
  animeId: number,
  episode: number,
  providerOverride?: string,
  streamServer?: string
): Promise<StreamSource> {
  const provider = providerOverride || process.env.STREAM_PROVIDER || "dummy";

  try {
    if (provider === "anipy") {
      return getAnipyStream(animeId, episode);
    }

    if (provider === "aniwatch") {
      return getAniwatchStream(animeId, episode);
    }

    if (provider === "animepahe" || provider === "pahe") {
      return getAnimepaheStream(animeId, episode);
    }

    if (provider === "miruro") {
      return getMiruroStream(animeId, episode, streamServer);
    }
  } catch (error) {
    const fallback = await getDummyStream(animeId, episode);

    return {
      ...fallback,
      provider:
        provider === "miruro"
          ? "miruro"
          : provider === "aniwatch"
            ? "aniwatch"
            : provider === "animepahe" || provider === "pahe"
              ? "animepahe"
              : "dummy",
      notice: `Stream provider failed: ${error instanceof Error ? error.message : "unknown error"
        }`,
    };
  }

  return getDummyStream(animeId, episode);
}
