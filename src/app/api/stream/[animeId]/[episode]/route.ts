import { getStreamSource } from "@/lib/stream-providers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ animeId: string; episode: string }> }
) {
  const { animeId, episode } = await params;
  const { searchParams } = new URL(request.url);
  const animeIdNumber = Number(animeId);
  const episodeNumber = Number(episode);
  const provider = searchParams.get("provider") || undefined;
  const episodeCategory = searchParams.get("episodeCategory") || undefined;
  const episodeProvider = searchParams.get("episodeProvider") || undefined;
  const server = searchParams.get("server") || undefined;

  if (!Number.isInteger(animeIdNumber) || !Number.isInteger(episodeNumber)) {
    return Response.json(
      { error: "Invalid anime id or episode number." },
      { status: 400 }
    );
  }

  const source = await getStreamSource(
    animeIdNumber,
    episodeNumber,
    provider,
    server,
    episodeProvider,
    episodeCategory
  );

  return Response.json(source);
}
