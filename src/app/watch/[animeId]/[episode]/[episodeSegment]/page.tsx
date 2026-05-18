import WatchPage from "../page";
import { parseEpisodeSegment } from "@/lib/watch-path";

export { generateMetadata } from "../page";

export default async function WatchSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ animeId: string; episode: string; episodeSegment: string }>;
  searchParams: Promise<{
    episodeCategory?: string | string[];
    episodeProvider?: string | string[];
    server?: string | string[];
  }>;
}) {
  const { animeId, episodeSegment } = await params;

  return WatchPage({
    params: Promise.resolve({
      animeId,
      episode: String(parseEpisodeSegment(episodeSegment)),
    }),
    searchParams,
  });
}
