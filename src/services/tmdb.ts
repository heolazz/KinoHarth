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
