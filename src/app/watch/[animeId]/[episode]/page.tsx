import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { parseEpisodeSegment } from "@/lib/watch-path";
import { WatchClient } from "./watch-client";

export const metadata: Metadata = {
  title: "Watch Anime | KinoHarth",
  description: "Watch anime episodes on KinoHarth.",
};

export default async function WatchPage({
  params,
}: {
  params: Promise<{ animeId: string; episode: string }>;
  searchParams: Promise<{
    episodeCategory?: string | string[];
    episodeProvider?: string | string[];
    server?: string | string[];
  }>;
}) {
  const { animeId, episode } = await params;
  const animeIdNumber = Number(animeId);
  const episodeNumber = parseEpisodeSegment(episode);

  if (!Number.isInteger(animeIdNumber) || !Number.isInteger(episodeNumber)) {
    notFound();
  }

  return <WatchClient animeId={animeIdNumber} episode={episodeNumber} />;
}
