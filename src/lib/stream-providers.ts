import { getAnimeDetail } from "@/services/anilist";

export type StreamSourceType = "dummy" | "embed" | "hls";

export type StreamOption = {
  url: string;
  type: Exclude<StreamSourceType, "dummy">;
  server: string;
  priority?: number;
  referer?: string;
};

export type StreamProviderOption = {
  provider: string;
  category: string;
  tags: string[];
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
  availableEpisodes?: number[];
  providerOptions?: StreamProviderOption[];
  selectedEpisodeProvider?: string;
  selectedEpisodeCategory?: string;
  notice?: string;
};

type StreamContext = {
  title?: string;
  poster?: string | null;
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

type HianimeAnime = {
  id?: string | null;
  name?: string | null;
  jname?: string | null;
};

type HianimeMapperResponse = {
  data?: {
    episodesList?: HianimeMapperEpisode[];
  };
  episodes?: HianimeMapperEpisode[];
};

function getTitle(data: Awaited<ReturnType<typeof getAnimeDetail>> | null) {
  const anime = data?.Media;

  if (!anime) {
    return "Unknown Anime";
  }

  return anime.title.english || anime.title.romaji || anime.title.native;
}

function getCandidateTitles(data: Awaited<ReturnType<typeof getAnimeDetail>>) {
  const anime = data?.Media;

  if (!anime) {
    return [];
  }

  return [
    anime.title.english,
    anime.title.romaji,
    anime.title.native,
  ].filter(Boolean) as string[];
}

function getPoster(data: Awaited<ReturnType<typeof getAnimeDetail>> | null) {
  const anime = data?.Media;

  return anime?.bannerImage || anime?.coverImage.extraLarge || null;
}

function getContextTitle(context: StreamContext | undefined, data: Awaited<ReturnType<typeof getAnimeDetail>> | null) {
  return context?.title || getTitle(data);
}

function getContextPoster(context: StreamContext | undefined, data: Awaited<ReturnType<typeof getAnimeDetail>> | null) {
  return context?.poster ?? getPoster(data);
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickBestAniwatchResult(
  results: HianimeAnime[],
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

async function createHiAnimeScraper() {
  const { HiAnime } = await import("aniwatch");

  return new HiAnime.Scraper();
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

async function getDummyStream(
  animeId: number,
  episode: number,
  context?: StreamContext
): Promise<StreamSource> {
  const data = context?.title ? null : await getAnimeDetail(animeId);

  return {
    provider: "dummy",
    type: "dummy",
    animeId,
    episode,
    title: getContextTitle(context, data),
    url: null,
    poster: getContextPoster(context, data),
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
  const hianime = await createHiAnimeScraper();
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
  const hianime = await createHiAnimeScraper();

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
  isActive?: boolean;
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

type MiruroEpisodeCandidate = {
  item: MiruroEpisodeItem;
  provider: string;
  category: string;
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

function getMiruroProviderRank(provider: string | undefined) {
  const preferred = [
    "ally",
    "bee",
    "zoro",
    "dune",
    "animekai",
    "hop",
    "allanime",
    "kiwi",
  ];
  const index = preferred.indexOf(provider?.toLowerCase() || "");

  return index === -1 ? preferred.length : index;
}

function getMiruroCategoryRank(category: string) {
  const preferred = ["sub", "dub", "raw"];
  const index = preferred.indexOf(category);

  return index === -1 ? preferred.length : index;
}

function getMiruroEpisodes(json: MiruroEpisodesResponse): MiruroEpisodeItem[] {
  const episodes: MiruroEpisodeItem[] = [];

  if (json?.data?.providers) {
    const providers = json.data.providers;

    for (const key of Object.keys(providers)) {
      if (providers[key]?.episodes) {
        const sub = providers[key].episodes?.sub || [];
        const dub = providers[key].episodes?.dub || [];
        const raw = providers[key].episodes?.raw || [];

        episodes.push(...sub.map((item) => ({ ...item, provider: key, category: "sub" })));
        episodes.push(...dub.map((item) => ({ ...item, provider: key, category: "dub" })));
        episodes.push(...raw.map((item) => ({ ...item, provider: key, category: "raw" })));
      }
    }
  }

  return episodes;
}

function getMiruroEpisodeCandidates(
  episodes: MiruroEpisodeItem[],
  episodeNumber: number,
  preferredProvider?: string,
  preferredCategory?: string
) {
  const selectedProvider = preferredProvider?.toLowerCase();
  const selectedCategory = preferredCategory?.toLowerCase();

  return episodes
    .filter((item) => {
      const number = item.number ?? item.episode;

      return Number(number) === episodeNumber && Boolean(item.id || item.slug);
    })
    .map((item): MiruroEpisodeCandidate => ({
      item,
      provider: item.provider || "zoro",
      category: item.category || "sub",
    }))
    .sort((a, b) => {
      if (selectedProvider) {
        const aSelected = a.provider.toLowerCase() === selectedProvider;
        const bSelected = b.provider.toLowerCase() === selectedProvider;

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
      }

      if (selectedCategory) {
        const aSelected = a.category.toLowerCase() === selectedCategory;
        const bSelected = b.category.toLowerCase() === selectedCategory;

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
      }

      if (a.category === "sub" && b.category !== "sub") return -1;
      if (a.category !== "sub" && b.category === "sub") return 1;

      const categoryRank = getMiruroCategoryRank(a.category) - getMiruroCategoryRank(b.category);

      if (categoryRank !== 0) {
        return categoryRank;
      }

      return getMiruroProviderRank(a.provider) - getMiruroProviderRank(b.provider);
    });
}

function getMiruroAvailableEpisodes(episodes: MiruroEpisodeItem[]) {
  return Array.from(
    new Set(
      episodes
        .map((item) => Number(item.number ?? item.episode))
        .filter((number) => Number.isInteger(number) && number > 0)
    )
  ).sort((a, b) => a - b);
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

function getMiruroQualityRank(quality: string | undefined) {
  const match = quality?.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function getMiruroStreamLabel(stream: MiruroWatchStream) {
  if (stream.server) {
    return stream.server;
  }

  const url = getMiruroStreamUrl(stream);
  const type = url ? getMiruroStreamType(stream, url) : "embed";
  const typeLabel = type === "hls" ? "HLS" : "Embed";

  return stream.quality ? `${stream.quality} ${typeLabel}` : typeLabel;
}

function sortMiruroStreams(streams: MiruroWatchStream[]) {
  return [...streams].sort((a, b) => {
    const priorityA = a.priority ?? Number.NEGATIVE_INFINITY;
    const priorityB = b.priority ?? Number.NEGATIVE_INFINITY;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    const urlA = getMiruroStreamUrl(a);
    const urlB = getMiruroStreamUrl(b);
    const typeA = urlA ? getMiruroStreamType(a, urlA) : "hls";
    const typeB = urlB ? getMiruroStreamType(b, urlB) : "hls";

    if (typeA !== typeB) {
      return typeA === "embed" ? -1 : 1;
    }

    const qualityRank = getMiruroQualityRank(b.quality) - getMiruroQualityRank(a.quality);

    if (qualityRank !== 0) {
      return qualityRank;
    }

    return 0;
  });
}

function getUniqueMiruroStreams(streams: MiruroWatchStream[]) {
  const validStreams = sortMiruroStreams(
    streams.filter((stream) => getMiruroStreamUrl(stream))
  );

  const seenUrls = new Set<string>();
  const nameCounts = new Map<string, number>();

  return validStreams
    .filter((stream) => {
      const url = getMiruroStreamUrl(stream);
      if (!url || seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    })
    .map((stream) => {
      let serverName = getMiruroStreamLabel(stream);
      const count = (nameCounts.get(serverName) || 0) + 1;
      nameCounts.set(serverName, count);

      if (count > 1) {
        serverName = `${serverName} ${count}`;
      }

      return {
        stream,
        url: getMiruroStreamUrl(stream) as string,
        uniqueServer: serverName,
      };
    });
}

function getMiruroStreamOptions(streams: MiruroWatchStream[]): StreamOption[] {
  return getUniqueMiruroStreams(streams).map(({ stream, url, uniqueServer }) => ({
    url,
    type: getMiruroStreamType(stream, url),
    server: uniqueServer,
    priority: stream.priority,
    referer: stream.referer,
  }));
}

function normalizeServerName(server: string | undefined) {
  return server?.trim().toLowerCase() || "";
}

function pickMiruroStream(
  streams: MiruroWatchStream[],
  preferredServer?: string
) {
  const uniqueStreams = getUniqueMiruroStreams(streams);
  const selectedServer = normalizeServerName(preferredServer);

  if (selectedServer) {
    const found = uniqueStreams.find(
      ({ uniqueServer }) => normalizeServerName(uniqueServer) === selectedServer
    );
    if (found) return found.stream;
  }

  return uniqueStreams[0]?.stream || null;
}

function getMiruroSourceList(watchJson: MiruroWatchResponse) {
  const sourceList = [
    ...(watchJson.data?.streams || []),
    ...(watchJson.data?.sources || []),
    ...(watchJson.data?.ssub?.streams || []),
    ...(watchJson.data?.dub?.streams || []),
    ...(watchJson.data?.raw?.streams || []),
    ...(watchJson.sources || []),
  ];

  if (watchJson.data?.source) sourceList.unshift(watchJson.data.source);
  if (watchJson.source) sourceList.unshift(watchJson.source);

  return sourceList;
}

function getMiruroSubtitlesList(watchJson: MiruroWatchResponse) {
  return [
    ...(watchJson.data?.subtitles || []),
    ...(watchJson.data?.ssub?.subtitles || []),
    ...(watchJson.data?.dub?.subtitles || []),
    ...(watchJson.data?.raw?.subtitles || []),
    ...(watchJson.subtitles || []),
  ];
}

function getMiruroProviderTags(
  sourceList: MiruroWatchStream[],
  subtitlesList: MiruroSubtitle[]
) {
  const tags: string[] = [];

  if (
    sourceList.some((stream) => {
      const url = getMiruroStreamUrl(stream);

      return url ? getMiruroStreamType(stream, url) === "embed" : false;
    })
  ) {
    tags.push("EMBED");
  }

  tags.push(subtitlesList.length > 0 ? "S-SUB" : "H-SUB");

  return tags;
}

function getMiruroEndpointPath(candidate: MiruroEpisodeCandidate, animeId: number) {
  const watchPath = candidate.item.id || candidate.item.slug;

  if (!watchPath) {
    return null;
  }

  return watchPath.startsWith("watch/")
    ? `/api/v2/miruro/${watchPath}`
    : `/api/v2/miruro/watch/${candidate.provider}/${animeId}/${candidate.category}/${watchPath}`;
}

async function getMiruroStream(
  animeId: number,
  episode: number,
  streamServer?: string,
  episodeProvider?: string,
  episodeCategory?: string,
  context?: StreamContext
): Promise<StreamSource> {
  const baseUrl = process.env.MIRURO_API_BASE_URL;

  if (!baseUrl) {
    const fallback = await getDummyStream(animeId, episode, context);

    return {
      ...fallback,
      provider: "miruro",
      notice: "Set MIRURO_API_BASE_URL before using Miruro provider.",
    };
  }

  const data = context?.title ? null : await getAnimeDetail(animeId);
  const title = getContextTitle(context, data);
  const poster = getContextPoster(context, data);

  try {
    const episodesJson = await fetchMiruroJson<MiruroEpisodesResponse>(
      `/api/v2/miruro/episodes/${animeId}`,
      baseUrl
    );

    const episodes = getMiruroEpisodes(episodesJson);
    const availableEpisodes = getMiruroAvailableEpisodes(episodes);
    const candidates = getMiruroEpisodeCandidates(
      episodes,
      episode,
      episodeProvider,
      episodeCategory
    );

    if (candidates.length === 0) {
      return {
        provider: "miruro",
        type: "dummy",
        animeId,
        episode,
        title,
        url: null,
        poster,
        subtitles: [],
        availableEpisodes,
        notice: `Miruro could not find episode ${episode} for AniList ID ${animeId}.`,
      };
    }

    const providerOptions: StreamProviderOption[] = [];
    const watchCandidates: {
      candidate: MiruroEpisodeCandidate;
      sourceList: MiruroWatchStream[];
      streamOptions: StreamOption[];
      subtitlesList: MiruroSubtitle[];
      watchJson: MiruroWatchResponse;
    }[] = [];

    for (const candidate of candidates) {
      const endpointPath = getMiruroEndpointPath(candidate, animeId);

      if (!endpointPath) {
        continue;
      }

      try {
        const watchJson = await fetchMiruroJson<MiruroWatchResponse>(
          endpointPath,
          baseUrl
        );
        const sourceList = getMiruroSourceList(watchJson);
        const streamOptions = getMiruroStreamOptions(sourceList);

        if (streamOptions.length === 0) {
          continue;
        }

        const subtitlesList = getMiruroSubtitlesList(watchJson);

        providerOptions.push({
          provider: candidate.provider,
          category: candidate.category,
          tags: getMiruroProviderTags(sourceList, subtitlesList),
        });
        watchCandidates.push({
          candidate,
          sourceList,
          streamOptions,
          subtitlesList,
          watchJson,
        });
      } catch {
        continue;
      }
    }

    for (const preferredServer of streamServer ? [streamServer, undefined] : [undefined]) {
      for (const watchCandidate of watchCandidates) {
        const stream = pickMiruroStream(watchCandidate.sourceList, preferredServer);
        const url = stream ? getMiruroStreamUrl(stream) : null;

        if (!stream || !url) {
          continue;
        }

        const referer =
          stream.referer ||
          watchCandidate.watchJson.data?.ssub?.streams?.[0]?.referer ||
          watchCandidate.watchJson.data?.sources?.[0]?.referer;
        const headers: Record<string, string> =
          watchCandidate.watchJson.data?.headers || watchCandidate.watchJson.headers || {};

        if (referer) headers["Referer"] = referer;

        return {
          provider: "miruro",
          type: getMiruroStreamType(stream, url),
          animeId,
          episode,
          title,
          url,
          poster,
          headers,
          resolvedAnime: {
            id: String(watchCandidate.candidate.item.id || watchCandidate.candidate.item.slug),
            name: title,
          },
          subtitles: watchCandidate.subtitlesList
            .map((subtitle) => ({
              label: subtitle.label || subtitle.lang || subtitle.language || "Subtitle",
              src: subtitle.file || subtitle.url || subtitle.src || "",
              language: subtitle.language || subtitle.lang,
            }))
            .filter((subtitle) => Boolean(subtitle.src)),
          streams: watchCandidate.streamOptions,
          availableEpisodes,
          providerOptions,
          selectedEpisodeProvider: watchCandidate.candidate.provider,
          selectedEpisodeCategory: watchCandidate.candidate.category,
          notice: `Resolved through Miruro ${watchCandidate.candidate.provider}/${watchCandidate.candidate.category} using ${getMiruroStreamLabel(stream)} server.`,
        };
      }
    }

    return {
      provider: "miruro",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster,
      subtitles: [],
      availableEpisodes,
      providerOptions,
      notice: `Miruro found episode ${episode}, but all providers returned no playable stream.`,
    };
  } catch (error) {
    return {
      provider: "miruro",
      type: "dummy",
      animeId,
      episode,
      title,
      url: null,
      poster,
      subtitles: [],
      notice: `Miruro API failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

export async function getStreamSource(
  animeId: number,
  episode: number,
  providerOverride?: string,
  streamServer?: string,
  episodeProvider?: string,
  episodeCategory?: string,
  context?: StreamContext
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
      return getMiruroStream(
        animeId,
        episode,
        streamServer,
        episodeProvider,
        episodeCategory,
        context
      );
    }
  } catch (error) {
    const fallback = await getDummyStream(animeId, episode, context);

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

  return getDummyStream(animeId, episode, context);
}
