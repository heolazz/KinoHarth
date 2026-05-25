export type AnimeEpisodeMetadataItem = {
  number: number;
  title: string;
  thumbnail: string | null;
  site?: string;
};

export type AnimeMetadataResponse = {
  tmdbId: number | null;
  tmdbSeason: number | null;
  tmdbLogo?: string | null;
  episodes: AnimeEpisodeMetadataItem[];
};

export async function getAnimeMetadataBrowser(animeId: number) {
  const response = await fetch(`/api/anime-metadata/${animeId}`, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Anime metadata responded with ${response.status}`);
  }

  return (await response.json()) as AnimeMetadataResponse;
}
