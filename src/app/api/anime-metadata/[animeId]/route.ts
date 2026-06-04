import { getAnimeDetail } from "@/services/anilist";
import { getAnimeMetadataServer } from "@/services/anime-metadata";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ animeId: string }> }
) {
  const { animeId } = await params;
  const animeIdNumber = Number(animeId);

  if (!Number.isInteger(animeIdNumber)) {
    return Response.json({ error: "Invalid anime id." }, { status: 400 });
  }

  const animeDetail = await getAnimeDetail(animeIdNumber).catch(() => null);
  const metadata = await getAnimeMetadataServer(
    animeIdNumber, 
    animeDetail?.Media?.format, 
    animeDetail?.Media?.title.english, 
    animeDetail?.Media?.title.romaji
  );

  return Response.json(metadata);
}
