import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAnimeDetail } from "@/services/anilist";
import { AnimeDetailClient, type AnimeDetail } from "./anime-detail-client";

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
  const detail = Number.isInteger(animeId)
    ? await getAnimeDetail(animeId)
    : null;

  if (!detail?.Media) {
    notFound();
  }

  return (
    <AnimeDetailClient
      id={animeId}
      initialAnime={detail.Media as AnimeDetail}
    />
  );
}
