const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL =
  process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";

export type TmdbEpisodeStill = {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
};

type TmdbEpisodeImagesResponse = {
  id: number;
  stills: TmdbEpisodeStill[];
};

export function getTmdbImageUrl(
  filePath: string | null | undefined,
  size: "w300" | "w500" | "w780" | "original" = "w500"
) {
  if (!filePath) {
    return null;
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${filePath}`;
}

export async function getTmdbEpisodeImages({
  seriesId,
  seasonNumber,
  episodeNumber,
}: {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
}) {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    return null;
  }

  const url = new URL(
    `${TMDB_API_URL}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/images`
  );

  url.searchParams.set("include_image_language", "en,null");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TmdbEpisodeImagesResponse;
  } catch {
    return null;
  }
}

export async function getBestTmdbEpisodeThumbnail({
  seriesId,
  seasonNumber,
  episodeNumber,
}: {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
}) {
  const data = await getTmdbEpisodeImages({
    seriesId,
    seasonNumber,
    episodeNumber,
  });

  const bestStill =
    data?.stills
      .filter((still) => still.file_path)
      .sort((a, b) => {
        const voteDiff = b.vote_average - a.vote_average;

        if (voteDiff !== 0) {
          return voteDiff;
        }

        return b.width - a.width;
      })[0] || null;

  return getTmdbImageUrl(bestStill?.file_path, "w500");
}

export type TmdbSeasonEpisode = {
  episode_number: number;
  still_path: string | null;
  name: string;
};

export type TmdbSeasonDetailsResponse = {
  id: number;
  episodes: TmdbSeasonEpisode[];
};

export async function getTmdbSeasonDetails({
  seriesId,
  seasonNumber,
}: {
  seriesId: number;
  seasonNumber: number;
}): Promise<TmdbSeasonDetailsResponse | null> {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    return null;
  }

  const url = new URL(`${TMDB_API_URL}/tv/${seriesId}/season/${seasonNumber}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24, // Cache for 24 hours
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TmdbSeasonDetailsResponse;
  } catch {
    return null;
  }
}

export async function getTmdbSeasonThumbnails({
  seriesId,
  seasonNumber,
}: {
  seriesId: number;
  seasonNumber: number;
}): Promise<Record<number, string> | null> {
  const data = await getTmdbSeasonDetails({ seriesId, seasonNumber });

  if (!data || !data.episodes) {
    return null;
  }

  const thumbnails: Record<number, string> = {};

  for (const episode of data.episodes) {
    if (episode.still_path) {
      const url = getTmdbImageUrl(episode.still_path, "w500");

      if (url) {
        thumbnails[episode.episode_number] = url;
      }
    }
  }

  return thumbnails;
}

export async function getTmdbLogo(tmdbId: number, type: "tv" | "movie" = "tv"): Promise<{ url: string; aspectRatio: number } | null> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) return null;

  const url = new URL(`${TMDB_API_URL}/${type}/${tmdbId}/images`);
  url.searchParams.set("include_image_language", "en,ja,null");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return null;

    const imageData = await response.json();
    const logo =
      imageData.logos?.find((item: any) => item.iso_639_1 === "en") ||
      imageData.logos?.find((item: any) => item.iso_639_1 === "ja") ||
      imageData.logos?.find((item: any) => item.iso_639_1 === null) ||
      imageData.logos?.[0];

    if (!logo) return null;

    const logoUrl = getTmdbImageUrl(logo.file_path, "original");
    if (!logoUrl) return null;

    const width = logo.width || 1;
    const height = logo.height || 1;

    return {
      url: logoUrl,
      aspectRatio: width / height,
    };
  } catch {
    return null;
  }
}

export async function getTmdbAnimeLogo(tmdbId: number, isMovie: boolean = false): Promise<{ url: string; aspectRatio: number } | null> {
  let logo = await getTmdbLogo(tmdbId, isMovie ? "movie" : "tv");
  if (!logo) {
    logo = await getTmdbLogo(tmdbId, isMovie ? "tv" : "movie");
  }
  return logo;
}

export async function searchTmdb(query: string, isMovie: boolean = false): Promise<number | null> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token || !query) return null;

  const url = new URL(`${TMDB_API_URL}/search/${isMovie ? "movie" : "tv"}`);
  url.searchParams.set("query", query);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    
    // If not found in primary format, try the other
    const fallbackUrl = new URL(`${TMDB_API_URL}/search/${isMovie ? "tv" : "movie"}`);
    fallbackUrl.searchParams.set("query", query);
    
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 },
    });
    
    if (!fallbackResponse.ok) return null;
    
    const fallbackData = await fallbackResponse.json();
    return fallbackData.results?.[0]?.id || null;
  } catch {
    return null;
  }
}
