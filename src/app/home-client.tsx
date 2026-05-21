"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, ListVideo, Radio } from "lucide-react";

import { AiringScheduleTabs } from "@/components/anime/airing-schedule-tabs";
import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { ContinueWatching } from "@/components/anime/continue-watching";
import { HeroSlider } from "@/components/anime/hero-slider";
import type { AiringScheduleItem, Anime } from "@/services/anilist";
import {
  getAiringScheduleBrowser,
  getPopularAnimeBrowser,
  getRecentlyUpdatedAnimeBrowser,
  getTrendingAnimeBrowser,
} from "@/services/anilist-browser";
import { getScheduleWindow } from "@/lib/utils";

export type HomeState = {
  trendingAnime: Anime[];
  popularAnime: Anime[];
  recentlyUpdatedAnime: Anime[];
  schedule: AiringScheduleItem[];
};

type HomeLoadState = {
  key: string;
  data: HomeState | null;
  error: string | null;
};

export function HomeClient({
  day,
  initialData,
}: {
  day?: string;
  initialData?: HomeState | null;
}) {
  const scheduleWindow = useMemo(() => getScheduleWindow(day), [day]);
  const requestKey = `${scheduleWindow.start}:${scheduleWindow.end}`;
  const [state, setState] = useState<HomeLoadState | null>(() =>
    initialData
      ? {
          key: requestKey,
          data: initialData,
          error: null,
        }
      : null
  );

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getTrendingAnimeBrowser(1, 10),
      getPopularAnimeBrowser(1, 12),
      getRecentlyUpdatedAnimeBrowser(1, 9),
      getAiringScheduleBrowser({
        page: 1,
        perPage: 50,
        airingAtGreater: scheduleWindow.start,
        airingAtLesser: scheduleWindow.end,
      }),
    ])
      .then((results) => {
        if (cancelled) return;

        const failures = results.filter((result) => result.status === "rejected");
        if (failures.length === results.length) {
          throw failures[0].reason;
        }

        setState({
          key: requestKey,
          error: null,
          data: {
            trendingAnime:
              results[0].status === "fulfilled" ? results[0].value.Page?.media || [] : [],
            popularAnime:
              results[1].status === "fulfilled" ? results[1].value.Page?.media || [] : [],
            recentlyUpdatedAnime:
              results[2].status === "fulfilled" ? results[2].value.Page?.media || [] : [],
            schedule:
              results[3].status === "fulfilled"
                ? results[3].value.Page?.airingSchedules || []
                : [],
          },
        });
      })
      .catch((caught) => {
        if (!cancelled) {
          setState({
            key: requestKey,
            data: null,
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, scheduleWindow.end, scheduleWindow.start]);

  const data = state?.key === requestKey ? state.data : null;
  const error = state?.key === requestKey ? state.error : null;

  if (error) {
    return (
      <div className="min-h-screen px-4 pt-28">
        <AnimeError message={error} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen px-4 pt-28">
        <AnimeLoading title="Loading KinoHarth" />
      </div>
    );
  }

  const featuredUpdate = data.recentlyUpdatedAnime[0];
  const updateFeed = data.recentlyUpdatedAnime.slice(1);

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSlider animes={data.trendingAnime} />

      <section className="container relative z-20 mx-auto -mt-4 space-y-16 px-4 pb-20 pt-12 md:px-6">
        <ContinueWatching />

        <div id="trending" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white/95">
              Trending Now
            </h2>
          </div>
          <div className="hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-6">
            {data.trendingAnime.map((anime, index) => (
              <div
                key={anime.id}
                className="min-w-[200px] snap-start md:min-w-[220px] lg:min-w-[240px]"
              >
                <AnimeCard anime={anime} variant="trending" rank={index + 1} />
              </div>
            ))}
          </div>
        </div>

        <div id="recently-updated" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white/95">
                Recently Updated
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Fresh changes from AniList, packed for quick scanning
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
            {featuredUpdate && (
              <Link
                href={`/anime/${featuredUpdate.id}`}
                prefetch={false}
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
                      {featuredUpdate.title.english ||
                        featuredUpdate.title.romaji ||
                        featuredUpdate.title.native}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/75">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {featuredUpdate.format}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {featuredUpdate.status}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {featuredUpdate.episodes
                          ? `${featuredUpdate.episodes} EPS`
                          : "TBA EPS"}
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
                  prefetch={false}
                  className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={anime.coverImage.medium}
                      alt={anime.title.english || anime.title.romaji || anime.title.native}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
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

        <AiringScheduleTabs
          schedule={data.schedule}
          initialDay={scheduleWindow.selectedDay}
        />

        <div id="popular" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white/95">
              Popular Releases
            </h2>
          </div>
          <div className="hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-6">
            {data.popularAnime.map((anime) => (
              <div
                key={anime.id}
                className="min-w-[200px] snap-start md:min-w-[220px] lg:min-w-[240px]"
              >
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
