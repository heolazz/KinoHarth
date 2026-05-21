import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAnimeDetail } from "@/services/anilist";
import { AnimeDetailClient, type AnimeDetail } from "./anime-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const animeId = Number(id);
  const detail = Number.isInteger(animeId)
    ? await getAnimeDetail(animeId)
    : null;
  const anime = detail?.Media;

  if (!anime) {
    return {
      title: "Anime Not Found | KinoHarth",
      description: "The requested anime could not be found.",
    };
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const description = anime.description?.replace(/<[^>]*>?/gm, "") || "Anime details on KinoHarth.";

  return {
    title: `${title} - Watch on KinoHarth`,
    description: description.substring(0, 160),
    openGraph: {
      title: `${title} - Watch on KinoHarth`,
      description: description.substring(0, 160),
      images: anime.coverImage?.extraLarge ? [anime.coverImage.extraLarge] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - Watch on KinoHarth`,
      description: description.substring(0, 160),
      images: anime.coverImage?.extraLarge ? [anime.coverImage.extraLarge] : [],
    },
  };
}

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
