import { getStreamSource } from "@/lib/stream-providers";

export async function GET(
  request: Request,
  context: RouteContext<"/api/stream/[animeId]/[episode]">
) {
  const { animeId, episode } = await context.params;
  const { searchParams } = new URL(request.url);
  const animeIdNumber = Number(animeId);
  const episodeNumber = Number(episode);
  const provider = searchParams.get("provider") || undefined;

  if (!Number.isInteger(animeIdNumber) || !Number.isInteger(episodeNumber)) {
    return Response.json(
      { error: "Invalid anime id or episode number." },
      { status: 400 }
    );
  }

  const source = await getStreamSource(animeIdNumber, episodeNumber, provider);

  return Response.json(source);
}
