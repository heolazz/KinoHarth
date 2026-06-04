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
  tmdbLogoRatio?: number | null;
  episodes: AnimeEpisodeMetadataItem[];
};

export async function getAnimeMetadataBrowser(animeId: number) {
  const response = await fetch(`/api/anime-metadata/${animeId}`);

  if (!response.ok) {
    throw new Error(`Anime metadata responded with ${response.status}`);
  }

  return (await response.json()) as AnimeMetadataResponse;
}

export async function getAnimeMetadataServer(animeId: number, animeFormat?: string, animeTitleEnglish?: string, animeTitleRomaji?: string): Promise<AnimeMetadataResponse> {
  const { getMiruroAnimeEpisodeMetadata } = await import("@/services/miruro");
  const { getTmdbSeasonThumbnails, getTmdbAnimeLogo, searchTmdb } = await import("@/services/tmdb");

  const metadata = await getMiruroAnimeEpisodeMetadata(animeId);
  const isMovie = animeFormat === "MOVIE";
  
  let tmdbId = metadata?.tmdbId || null;
  let tmdbSeason = metadata?.tmdbSeason || null;
  
  if (!tmdbId && (animeTitleEnglish || animeTitleRomaji)) {
    const searchTitle = animeTitleEnglish || animeTitleRomaji;
    if (searchTitle) {
      tmdbId = await searchTmdb(searchTitle, isMovie);
      if (tmdbId) {
        tmdbSeason = 1;
      }
    }
  }

  const seasonThumbnails =
    tmdbId && tmdbSeason
      ? await getTmdbSeasonThumbnails({
          seriesId: tmdbId,
          seasonNumber: tmdbSeason,
        })
      : null;

  const tmdbLogoData = tmdbId
    ? await getTmdbAnimeLogo(tmdbId, isMovie)
    : null;

  return {
    tmdbId: tmdbId || null,
    tmdbSeason: tmdbSeason || null,
    tmdbLogo: tmdbLogoData?.url || null,
    tmdbLogoRatio: tmdbLogoData?.aspectRatio || null,
    episodes:
      metadata?.episodes.map((episode) => ({
        number: episode.number,
        title: episode.title || `Episode ${episode.number}`,
        thumbnail: seasonThumbnails?.[episode.number] || episode.image || null,
        site: `${episode.provider}/${episode.category}`,
      })) || [],
  };
}
