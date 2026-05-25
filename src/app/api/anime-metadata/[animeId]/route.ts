import { getMiruroAnimeEpisodeMetadata } from "@/services/miruro";
import { getTmdbSeasonThumbnails, getTmdbAnimeLogo } from "@/services/tmdb";

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
  const seasonThumbnails =
    metadata?.tmdbId && metadata?.tmdbSeason
      ? await getTmdbSeasonThumbnails({
          seriesId: metadata.tmdbId,
          seasonNumber: metadata.tmdbSeason,
        })
      : null;

  const tmdbLogo = metadata?.tmdbId
    ? await getTmdbAnimeLogo(metadata.tmdbId)
    : null;

  return Response.json({
    tmdbId: metadata?.tmdbId || null,
    tmdbSeason: metadata?.tmdbSeason || null,
    tmdbLogo,
    episodes:
      metadata?.episodes.map((episode) => ({
        number: episode.number,
        title: episode.title || `Episode ${episode.number}`,
        thumbnail: episode.image || seasonThumbnails?.[episode.number] || null,
        site: `${episode.provider}/${episode.category}`,
      })) || [],
  });
}
