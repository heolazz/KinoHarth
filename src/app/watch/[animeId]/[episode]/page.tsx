import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListVideo,
  Server,
} from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { StreamPlayer } from "@/components/anime/stream-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStreamSource } from "@/lib/stream-providers";
import { Anime, getAnimeDetail } from "@/services/anilist";

const DEFAULT_EPISODE_COUNT = 12;

type RecommendationEdge = {
  node?: {
    mediaRecommendation?: Anime | null;
  } | null;
};

function buildEpisodes(totalEpisodes: number, currentEpisode: number) {
  return Array.from({ length: totalEpisodes }, (_, index) => {
    const episodeNumber = index + 1;

    return {
      number: episodeNumber,
      title:
        episodeNumber === currentEpisode
          ? "Now playing"
          : `Episode ${episodeNumber}`,
    };
  });
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ animeId: string; episode: string }>;
  searchParams: Promise<{ server?: string | string[] }>;
}) {
  const { animeId, episode } = await params;
  const { server } = await searchParams;
  const animeIdNumber = Number(animeId);
  const currentEpisode = Number(episode);
  const selectedServer = Array.isArray(server) ? server[0] : server;

  if (!Number.isInteger(animeIdNumber) || !Number.isInteger(currentEpisode)) {
    notFound();
  }

  const data = await getAnimeDetail(animeIdNumber);
  const anime = data?.Media;

  if (!anime) {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const totalEpisodes = anime.episodes || DEFAULT_EPISODE_COUNT;
  const safeEpisode = Math.min(Math.max(currentEpisode, 1), totalEpisodes);
  const streamSource = await getStreamSource(
    animeIdNumber,
    safeEpisode,
    undefined,
    selectedServer
  );
  const episodes = buildEpisodes(totalEpisodes, safeEpisode);
  const previousEpisode = safeEpisode > 1 ? safeEpisode - 1 : null;
  const nextEpisode = safeEpisode < totalEpisodes ? safeEpisode + 1 : null;
  const recommendations: Anime[] =
    anime.recommendations?.edges
      ?.map((edge: RecommendationEdge) => edge.node?.mediaRecommendation)
      .filter((recommendation: Anime | null | undefined): recommendation is Anime =>
        Boolean(recommendation)
      )
      .slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-[#111111] pt-24 text-white">
      <section className="container px-4 pb-12 md:px-8 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/anime/${anime.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Link>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <Server className="h-4 w-4" />
            {streamSource.provider} player
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <StreamPlayer
              key={`${anime.id}-${safeEpisode}-${streamSource.url || "empty"}`}
              source={streamSource}
              title={`${title} episode ${safeEpisode}`}
              fallbackPoster={anime.bannerImage || anime.coverImage.extraLarge}
              basePath={`/watch/${anime.id}/${safeEpisode}`}
            />

            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {anime.format}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {anime.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {streamSource.provider}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {streamSource.type}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-white/55">
                    <Clock className="h-4 w-4" />
                    {totalEpisodes} episodes
                  </span>
                </div>
                <h2 className="text-xl font-semibold">
                  Episode {safeEpisode}: {title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  render={
                    previousEpisode ? (
                      <Link href={`/watch/${anime.id}/${previousEpisode}`} />
                    ) : undefined
                  }
                  variant="outline"
                  className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={!previousEpisode}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  render={
                    nextEpisode ? (
                      <Link href={`/watch/${anime.id}/${nextEpisode}`} />
                    ) : undefined
                  }
                  className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
                  disabled={!nextEpisode}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ListVideo className="h-5 w-5" />
                  Episodes
                </h2>
                <span className="text-sm text-white/50">{totalEpisodes} total</span>
              </div>

              <div className="grid max-h-[440px] gap-2 overflow-y-auto pr-1">
                {episodes.map((item) => {
                  const isActive = item.number === safeEpisode;

                  return (
                    <Link
                      key={item.number}
                      href={`/watch/${anime.id}/${item.number}`}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        isActive
                          ? "border-white/30 bg-white text-black"
                          : "border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isActive ? "bg-black text-white" : "bg-white/10 text-white"
                        }`}
                      >
                        {item.number}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          Episode {item.number}
                        </span>
                        <span
                          className={`block truncate text-xs ${
                            isActive ? "text-black/60" : "text-white/45"
                          }`}
                        >
                          {item.title}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">More to watch</h2>
                <div className="grid grid-cols-2 gap-4">
                  {recommendations.map((recommendation) => (
                    <AnimeCard key={recommendation.id} anime={recommendation} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
