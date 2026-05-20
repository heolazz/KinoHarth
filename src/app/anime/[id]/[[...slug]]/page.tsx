import type { Metadata } from "next";

import { AnimeDetailClient } from "./anime-detail-client";

export const metadata: Metadata = {
  title: "Anime Detail | KinoHarth",
  description: "Anime details, episode information, characters, and recommendations on KinoHarth.",
};

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug?: string[] }>;
}) {
  const { id } = await params;
  const animeId = Number(id);

  return <AnimeDetailClient id={animeId} />;
}
