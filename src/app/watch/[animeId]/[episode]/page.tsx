import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { parseEpisodeSegment } from "@/lib/watch-path";
import { WatchClient } from "./watch-client";

import { getAnimeDetail } from "@/services/anilist";
import { getAnimeMetadataServer } from "@/services/anime-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ animeId: string; episode: string }>;
}): Promise<Metadata> {
  const { animeId, episode } = await params;
  const animeIdNumber = Number(animeId);
  const episodeNumber = parseEpisodeSegment(episode);

  const detail = Number.isInteger(animeIdNumber)
    ? await getAnimeDetail(animeIdNumber)
    : null;
  const anime = detail?.Media;

  if (!anime) {
    return {
      title: "Watch Anime | KinoHarth",
      description: "Watch anime episodes on KinoHarth.",
    };
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const description = anime.description?.replace(/<[^>]*>?/gm, "") || "Watch anime episodes on KinoHarth.";

  return {
    title: `Watch ${title} Episode ${episodeNumber} - KinoHarth`,
    description: `Watch ${title} Episode ${episodeNumber} online in high quality. ${description.substring(0, 100)}`,
    openGraph: {
      title: `Watch ${title} Episode ${episodeNumber} - KinoHarth`,
      description: `Watch ${title} Episode ${episodeNumber} online in high quality. ${description.substring(0, 100)}`,
      images: anime.coverImage?.extraLarge ? [anime.coverImage.extraLarge] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `Watch ${title} Episode ${episodeNumber} - KinoHarth`,
      description: `Watch ${title} Episode ${episodeNumber} online in high quality. ${description.substring(0, 100)}`,
      images: anime.coverImage?.extraLarge ? [anime.coverImage.extraLarge] : [],
    },
  };
}

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

  const detail = await getAnimeDetail(animeIdNumber).catch(() => null);
  const metadata = await getAnimeMetadataServer(
    animeIdNumber,
    detail?.Media?.format,
    detail?.Media?.title.english,
    detail?.Media?.title.romaji
  ).catch(() => null);

  return (
    <WatchClient
      animeId={animeIdNumber}
      episode={episodeNumber}
      initialAnime={detail?.Media || undefined}
      initialMetadata={metadata}
    />
  );
}
