export const ANILIST_API_URL =
  process.env.ANILIST_API_URL || "https://graphql.anilist.co";
const KINOHARTH_ANILIST_API_BASE_URL =
  process.env.KINOHARTH_ANILIST_API_BASE_URL?.replace(/\/$/, "");
const KINOHARTH_ANILIST_API_KEY = process.env.KINOHARTH_ANILIST_API_KEY;

export interface Anime {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  description: string;
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string;
  };
  bannerImage: string | null;
  episodes: number | null;
  status: string;
  genres: string[];
  averageScore: number;
  meanScore?: number | null;
  popularity: number;
  favourites?: number | null;
  season: string;
  seasonYear: number;
  type: string;
  format: string;
  duration?: number | null;
  source?: string | null;
  hashtag?: string | null;
  synonyms?: string[] | null;
  countryOfOrigin?: string | null;
  isAdult?: boolean | null;
  siteUrl?: string | null;
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  endDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  studios?: {
    nodes?: {
      id: number;
      name: string;
      isAnimationStudio?: boolean | null;
    }[];
  } | null;
  externalLinks?: {
    site: string;
    url: string;
    type?: string | null;
  }[] | null;
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
}

export interface AnimePageInfo {
  total: number;
  currentPage: number;
  lastPage?: number;
  hasNextPage: boolean;
  perPage?: number;
}

export interface AnimePageResponse {
  Page?: {
    pageInfo?: AnimePageInfo;
    media?: Anime[];
  };
}

export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  media: Anime;
}

export interface AiringScheduleResponse {
  Page?: {
    pageInfo?: AnimePageInfo;
    airingSchedules?: AiringScheduleItem[];
  };
}

export interface AnimeStreamingEpisode {
  title: string;
  thumbnail: string | null;
  url: string;
  site: string;
}

export interface AnimeDetailResponse {
  Media?: Anime & {
    streamingEpisodes?: AnimeStreamingEpisode[] | null;
    trailer?: {
      id: string;
      site: string;
      thumbnail: string;
    } | null;
    characters?: {
      edges?: {
        role: string;
        node: {
          id: number;
          name: {
            full: string;
          };
          image: {
            large: string;
          };
        };
        voiceActors?: {
          id: number;
          name: {
            full: string;
          };
          image: {
            large: string;
          };
        }[];
      }[];
    };
    recommendations?: {
      edges?: {
        node: {
          mediaRecommendation?: Anime | null;
        };
      }[];
    };
    relations?: {
      edges?: {
        relationType: string;
        node: Anime;
      }[];
    };
  };
}

export async function fetchAniList<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      cache: "force-cache",
      next: {
        revalidate: 300,
      },
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        [
          "AniList API HTTP Error",
          `url=${ANILIST_API_URL}`,
          `status=${response.status}`,
          `statusText=${response.statusText || "unknown"}`,
          `body=${errorText.slice(0, 500) || "empty"}`,
        ].join(" | ")
      );
      return null;
    }

    const json = await response.json();

    if (json.errors) {
      console.error("AniList API GraphQL Errors:", json.errors);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error("AniList API Network Error:", error);
    return null;
  }
}

async function fetchKinoHarthAniListApi<T>(
  path: string,
  params: Record<string, string | number | undefined> = {}
) {
  if (!KINOHARTH_ANILIST_API_BASE_URL) {
    return null;
  }

  const endpoint = new URL(
    `${KINOHARTH_ANILIST_API_BASE_URL}/api/${path.replace(/^\//, "")}`
  );

  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== "") {
      endpoint.searchParams.set(name, String(value));
    }
  });

  try {
    const response = await fetch(endpoint, {
      cache: "force-cache",
      next: {
        revalidate: 300,
      },
      headers: KINOHARTH_ANILIST_API_KEY
        ? {
            Accept: "application/json",
            "X-KinoHarth-Key": KINOHARTH_ANILIST_API_KEY,
          }
        : {
            Accept: "application/json",
          },
    });

    if (!response.ok) {
      console.error(
        `KinoHarth AniList API HTTP Error | url=${endpoint} | status=${response.status}`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("KinoHarth AniList API Network Error:", error);
    return null;
  }
}

// Queries
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

export async function getTrendingAnime(page = 1, perPage = 20) {
  const proxyData = await fetchKinoHarthAniListApi<AnimePageResponse>(
    "trending",
    { page, perPage }
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

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
        media (sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { page, perPage });
}

export async function getPopularAnime(page = 1, perPage = 20) {
  const proxyData = await fetchKinoHarthAniListApi<AnimePageResponse>(
    "popular",
    { page, perPage }
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { page, perPage });
}

export async function getRecentlyUpdatedAnime(page = 1, perPage = 12) {
  const proxyData = await fetchKinoHarthAniListApi<AnimePageResponse>(
    "recent",
    { page, perPage }
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (sort: UPDATED_AT_DESC, type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { page, perPage });
}

export async function getAiringSchedule({
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
  const proxyData = await fetchKinoHarthAniListApi<AiringScheduleResponse>(
    "schedule",
    {
      page,
      perPage,
      start: airingAtGreater,
      end: airingAtLesser,
    }
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

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

  return fetchAniList<AiringScheduleResponse>(query, {
    page,
    perPage,
    airingAtGreater,
    airingAtLesser,
  });
}

export async function getAnimeDetail(id: number) {
  const proxyData = await fetchKinoHarthAniListApi<AnimeDetailResponse>(
    `anime/${id}`
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

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

  return fetchAniList<AnimeDetailResponse>(query, { id });
}

export async function searchAnime(searchTerm: string, page = 1, perPage = 20) {
  const proxyData = await fetchKinoHarthAniListApi<AnimePageResponse>(
    "search",
    { q: searchTerm, page, perPage }
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          hasNextPage
        }
        media (search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC], type: ANIME, isAdult: false) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  return fetchAniList<AnimePageResponse>(query, { search: searchTerm, page, perPage });
}

export async function getAnimeCatalog({
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
  const proxyData = await fetchKinoHarthAniListApi<AnimePageResponse>(
    "catalog",
    {
      page,
      perPage,
      q: search,
      genre,
      status,
      format,
      sort: sort?.join(","),
      season,
      seasonYear,
    }
  );

  if (KINOHARTH_ANILIST_API_BASE_URL) {
    return proxyData;
  }

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
          isAdult: false
        ) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  const defaultSort = search ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC"];
  const finalSort = sort || defaultSort;

  return fetchAniList<AnimePageResponse>(query, {
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
