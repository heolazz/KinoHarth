import type {
  AiringScheduleResponse,
  AnimeDetailResponse,
  AnimePageResponse,
} from "@/services/anilist";

const ANILIST_API_URL = "https://graphql.anilist.co";
const CACHE_TTL_MS = 5 * 60 * 1000;

const ANIME_FRAGMENT = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  description
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  episodes
  status
  genres
  averageScore
  meanScore
  popularity
  favourites
  season
  seasonYear
  type
  format
  duration
  source
  hashtag
  synonyms
  countryOfOrigin
  isAdult
  siteUrl
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
  studios {
    nodes {
      id
      name
      isAnimationStudio
    }
  }
  externalLinks {
    site
    url
    type
  }
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const inFlight = new Map<string, Promise<unknown>>();

function hash(input: string) {
  let value = 5381;

  for (let index = 0; index < input.length; index += 1) {
    value = (value * 33) ^ input.charCodeAt(index);
  }

  return (value >>> 0).toString(36);
}

function getCacheKey(query: string, variables: Record<string, unknown>) {
  return `kinoharth:anilist:v2:${hash(JSON.stringify({ query, variables }))}`;
}

function readCache<T>(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CacheEntry<T>;
    if (cached.expiresAt < Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: Date.now() + CACHE_TTL_MS,
        value,
      } satisfies CacheEntry<T>)
    );
  } catch {
    // Cache is best-effort only.
  }
}

export async function fetchAniListBrowser<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const cacheKey = getCacheKey(query, variables);
  const cached = readCache<T>(cacheKey);

  if (cached) {
    return cached;
  }

  const existing = inFlight.get(cacheKey) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const request = fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })
    .then(async (response) => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `AniList API HTTP ${response.status}: ${text.slice(0, 300)}`
        );
      }

      const json = JSON.parse(text) as { data?: T; errors?: unknown };
      if (json.errors) {
        throw new Error(`AniList GraphQL error: ${JSON.stringify(json.errors)}`);
      }

      if (!json.data) {
        throw new Error("AniList returned no data.");
      }

      writeCache(cacheKey, json.data);
      return json.data;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, request);
  return request;
}

export function getTrendingAnimeBrowser(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (sort: TRENDING_DESC, type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, { page, perPage });
}

export function getPopularAnimeBrowser(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (sort: POPULARITY_DESC, type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, { page, perPage });
}

export function getTopRatedAnimeBrowser(page = 1, perPage = 12) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (sort: [SCORE_DESC, POPULARITY_DESC], type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, { page, perPage });
}

export function getRecentlyUpdatedAnimeBrowser(page = 1, perPage = 12) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (sort: UPDATED_AT_DESC, type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, { page, perPage });
}

export function getNewSeasonAnimeBrowser(page = 1, perPage = 12) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  let currentSeason = "WINTER";
  if (currentMonth >= 2 && currentMonth <= 4) currentSeason = "SPRING";
  else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = "SUMMER";
  else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = "FALL";

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, {
    page,
    perPage,
    season: currentSeason,
    seasonYear: currentYear
  });
}

export function getUpcomingAnimeBrowser(page = 1, perPage = 10) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (status: NOT_YET_RELEASED, sort: [POPULARITY_DESC], type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, { page, perPage });
}

export function getAiringScheduleBrowser({
  page = 1,
  perPage = 8,
  airingAtGreater,
  airingAtLesser,
}: {
  page?: number;
  perPage?: number;
  airingAtGreater: number;
  airingAtLesser: number;
}) {
  const query = `
    query (
      $page: Int,
      $perPage: Int,
      $airingAtGreater: Int,
      $airingAtLesser: Int
    ) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        airingSchedules (
          airingAt_greater: $airingAtGreater,
          airingAt_lesser: $airingAtLesser,
          sort: TIME
        ) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            ${ANIME_FRAGMENT}
          }
        }
      }
    }
  `;

  return fetchAniListBrowser<AiringScheduleResponse>(query, {
    page,
    perPage,
    airingAtGreater,
    airingAtLesser,
  }).then(data => {
    if (data?.Page?.airingSchedules) {
      data.Page.airingSchedules = data.Page.airingSchedules.filter(
        (schedule) => !schedule.media.isAdult && !schedule.media.genres?.includes("Hentai")
      );
    }
    return data;
  });
}

export function getAnimeDetailBrowser(id: number) {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        ${ANIME_FRAGMENT}
        trailer {
          id
          site
          thumbnail
        }
        characters (sort: [ROLE, RELEVANCE, ID], perPage: 10) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
        recommendations (perPage: 10, sort: RATING_DESC) {
          edges {
            node {
              mediaRecommendation {
                ${ANIME_FRAGMENT}
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              ${ANIME_FRAGMENT}
            }
          }
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimeDetailResponse>(query, { id });
}

export async function getAnimeByStudioBrowser(studioId: number, page = 1, perPage = 24) {
  const query = `
    query ($studioId: Int, $page: Int, $perPage: Int) {
      Studio(id: $studioId) {
        media(page: $page, perPage: $perPage, sort: POPULARITY_DESC, isMain: true, isAdult: false, genre_not_in: ["Hentai"]) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          nodes {
            ${ANIME_FRAGMENT}
          }
        }
      }
    }
  `;

  const data = await fetchAniListBrowser<{ Studio: { media: { pageInfo: any; nodes: any[] } } }>(query, { studioId, page, perPage });
  
  return {
    Page: {
      pageInfo: data?.Studio?.media?.pageInfo,
      media: data?.Studio?.media?.nodes || [],
    }
  } as unknown as AnimePageResponse;
}

export function searchAnimeBrowser(searchTerm: string, page = 1, perPage = 20) {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          hasNextPage
        }
        media (search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC], type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniListBrowser<AnimePageResponse>(query, {
    search: searchTerm,
    page,
    perPage,
  });
}

export function getAnimeCatalogBrowser({
  page = 1,
  perPage = 24,
  search,
  genre,
  status,
  format,
  sort,
  season,
  seasonYear,
}: {
  page?: number;
  perPage?: number;
  search?: string;
  genre?: string;
  status?: string;
  format?: string;
  sort?: string[];
  season?: string;
  seasonYear?: number;
}) {
  const query = `
    query (
      $page: Int,
      $perPage: Int,
      $search: String,
      $genre: String,
      $status: MediaStatus,
      $format: MediaFormat,
      $season: MediaSeason,
      $seasonYear: Int,
      $sort: [MediaSort]
    ) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (
          search: $search,
          genre: $genre,
          status: $status,
          format: $format,
          season: $season,
          seasonYear: $seasonYear,
          sort: $sort,
          type: ANIME,
          isAdult: false, genre_not_in: ["Hentai"]
        ) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  const defaultSort = search ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC"];
  const finalSort = sort || defaultSort;

  return fetchAniListBrowser<AnimePageResponse>(query, {
    page,
    perPage,
    search,
    genre,
    status,
    format,
    season,
    seasonYear,
    sort: finalSort,
  });
}
