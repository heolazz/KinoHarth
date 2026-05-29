import { getAnimeDetail } from "@/services/anilist";
import { getMiruroAnimeEpisodeMetadata } from "@/services/miruro";
import { getTmdbSeasonThumbnails, getTmdbAnimeLogo, searchTmdb } from "@/services/tmdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ animeId: string }> }
) {
  const { animeId } = await params;
  const animeIdNumber = Number(animeId);

  if (!Number.isInteger(animeIdNumber)) {
    return Response.json({ error: "Invalid anime id." }, { status: 400 });
  }

  const metadata = await getMiruroAnimeEpisodeMetadata(animeIdNumber);
  
  // Fetch anime detail to know if it's a MOVIE to correctly query TMDB logo
  const animeDetail = await getAnimeDetail(animeIdNumber).catch(() => null);
  const isMovie = animeDetail?.Media?.format === "MOVIE";
  
  let tmdbId = metadata?.tmdbId || null;
  let tmdbSeason = metadata?.tmdbSeason || null;
  
  if (!tmdbId && animeDetail?.Media) {
    // Try to find TMDB ID using anime title
    const searchTitle = animeDetail.Media.title.english || animeDetail.Media.title.romaji;
    if (searchTitle) {
      tmdbId = await searchTmdb(searchTitle, isMovie);
      if (tmdbId) {
        tmdbSeason = 1; // Default to season 1 for fallback searches
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

  return Response.json({
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
  });
}
