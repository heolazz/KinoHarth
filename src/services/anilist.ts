export const ANILIST_API_URL = "https://graphql.anilist.co";

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
  popularity: number;
  season: string;
  seasonYear: number;
  type: string;
  format: string;
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

export interface AnimeDetailResponse {
  Media?: Anime & {
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
        node: {
          id: number;
          title: {
            romaji: string;
            english: string | null;
          };
          type: string;
          format: string;
          coverImage: {
            medium: string;
          };
        };
      }[];
    };
  };
}

export async function fetchAniList<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: { revalidate: 3600 } // Cache for 1 hour by default
    });

    const json = await response.json();

    if (json.errors) {
      console.error("AniList API Errors:", json.errors);
      throw new Error("Failed to fetch from AniList API");
    }

    return json.data;
  } catch (error) {
    console.error("AniList API Error:", error);
    throw error;
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
  popularity
  season
  seasonYear
  type
  format
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;

export async function getTrendingAnime(page = 1, perPage = 20) {
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
              id
              title {
                romaji
                english
              }
              type
              format
              coverImage {
                medium
              }
            }
          }
        }
      }
    }
  `;

  return fetchAniList<AnimeDetailResponse>(query, { id });
}

export async function searchAnime(searchTerm: string, page = 1, perPage = 20) {
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
}: {
  page?: number;
  perPage?: number;
  search?: string;
  genre?: string;
  status?: string;
  format?: string;
}) {
  const query = `
    query (
      $page: Int,
      $perPage: Int,
      $search: String,
      $genre: String,
      $status: MediaStatus,
      $format: MediaFormat,
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
          sort: $sort,
          type: ANIME,
          isAdult: false
        ) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;

  const sort = search ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC"];

  return fetchAniList<AnimePageResponse>(query, {
    page,
    perPage,
    search,
    genre,
    status,
    format,
    sort,
  });
}
