import { Button } from "@/components/ui/button";
import { ArrowUpRight, Clapperboard, ListVideo, Play, Radio } from "lucide-react";
import {
  AiringScheduleItem,
  Anime,
  getAiringSchedule,
  getPopularAnime,
  getRecentlyUpdatedAnime,
  getTrendingAnime,
} from "@/services/anilist";
import { AiringScheduleTabs } from "@/components/anime/airing-schedule-tabs";
import { AnimeCard } from "@/components/anime/anime-card";
import { HeroSlider } from "@/components/anime/hero-slider";
import Link from "next/link";

async function getScheduleWindow(dayParam?: string) {
  const now = new Date();
  const currentDay = now.getDay();
  const selectedDay = dayParam ? parseInt(dayParam, 10) : currentDay;

  // Calculate the target date for the selected day within the current week
  const currentDayIso = currentDay === 0 ? 7 : currentDay;
  const selectedDayIso = selectedDay === 0 ? 7 : selectedDay;

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - currentDayIso + selectedDayIso);
  targetDate.setHours(0, 0, 0, 0);

  const start = Math.floor(targetDate.getTime() / 1000);
  const end = start + 24 * 60 * 60; // 1 day window only

  return {
    start,
    end,
    selectedDay,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { start, end, selectedDay } = await getScheduleWindow(resolvedSearchParams.day);
  const [trendingData, popularData, recentlyUpdatedData, scheduleData] =
    await Promise.all([
      getTrendingAnime(1, 10),
      getPopularAnime(1, 12),
      getRecentlyUpdatedAnime(1, 9),
      getAiringSchedule({
        page: 1,
        perPage: 50,
        airingAtGreater: start,
        airingAtLesser: end,
      }),
    ]);

  const trendingAnime: Anime[] = trendingData?.Page?.media || [];
  const popularAnime: Anime[] = popularData?.Page?.media || [];
  const recentlyUpdatedAnime: Anime[] = recentlyUpdatedData?.Page?.media || [];
  const schedule: AiringScheduleItem[] =
    scheduleData?.Page?.airingSchedules || [];
  const featuredUpdate = recentlyUpdatedAnime[0];
  const updateFeed = recentlyUpdatedAnime.slice(1);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSlider animes={trendingAnime} />

      {/* Content Sections */}
      <section className="container mx-auto px-4 md:px-6 -mt-4 pt-12 pb-20 space-y-16 relative z-20">
        {/* Trending Anime */}
        <div id="trending" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white/95">Trending Now</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
            {trendingAnime.map((anime, index) => (
              <div key={anime.id} className="min-w-[200px] md:min-w-[220px] lg:min-w-[240px] snap-start">
                <AnimeCard anime={anime} variant="trending" rank={index + 1} />
              </div>
            ))}
          </div>
        </div>

        {/* Recently Updated */}
        <div id="recently-updated" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white/95">Recently Updated</h2>
              <p className="mt-1 text-sm text-white/50">Fresh changes from AniList, packed for quick scanning</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
            {featuredUpdate && (
              <Link
                href={`/anime/${featuredUpdate.id}`}
                className="group relative min-h-[260px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.08]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-35 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url("${featuredUpdate.bannerImage || featuredUpdate.coverImage.extraLarge}")`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-black">
                      <Radio className="h-3.5 w-3.5" />
                      Latest Update
                    </span>
                    <span className="rounded-full bg-white/10 p-2 text-white/70 transition-colors group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="max-w-xl space-y-3">
                    <h3 className="line-clamp-2 text-3xl font-bold tracking-tight text-white">
                      {featuredUpdate.title.english || featuredUpdate.title.romaji || featuredUpdate.title.native}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/75">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {featuredUpdate.format}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {featuredUpdate.status}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {featuredUpdate.episodes ? `${featuredUpdate.episodes} EPS` : "TBA EPS"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {updateFeed.map((anime, index) => (
                <Link
                  key={anime.id}
                  href={`/anime/${anime.id}`}
                  className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={anime.coverImage.medium}
                      alt={anime.title.english || anime.title.romaji || anime.title.native}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/35">
                      <Clapperboard className="h-3 w-3" />
                      Updated
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-white/90 group-hover:text-white">
                      {anime.title.english || anime.title.romaji || anime.title.native}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                        <ListVideo className="h-3.5 w-3.5" />
                        {anime.episodes ? `${anime.episodes} EPS` : "TBA"}
                      </span>
                      <span>{anime.format}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <AiringScheduleTabs schedule={schedule} initialDay={selectedDay} />

        {/* Popular Anime */}
        <div id="popular" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white/95">Popular Releases</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
            {popularAnime.map((anime) => (
              <div key={anime.id} className="min-w-[200px] md:min-w-[220px] lg:min-w-[240px] snap-start">
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
