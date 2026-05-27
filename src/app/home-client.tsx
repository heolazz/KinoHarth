"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, ListVideo, Radio } from "lucide-react";

import { AiringScheduleTabs } from "@/components/anime/airing-schedule-tabs";
import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeGridTabs } from "@/components/anime/anime-grid-tabs";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { ContinueWatching } from "@/components/anime/continue-watching";
import { HeroSlider } from "@/components/anime/hero-slider";
import type { AiringScheduleItem, Anime } from "@/services/anilist";
import {
  getAiringScheduleBrowser,
  getPopularAnimeBrowser,
  getNewSeasonAnimeBrowser,
  getTopRatedAnimeBrowser,
  getTrendingAnimeBrowser,
} from "@/services/anilist-browser";
import { getScheduleWindow } from "@/lib/utils";

export type HomeState = {
  trendingAnime: Anime[];
  popularAnime: Anime[];
  newSeasonAnime: Anime[];
  topRatedAnime: Anime[];
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
      getPopularAnimeBrowser(1, 48),
      getNewSeasonAnimeBrowser(1, 48),
      getTopRatedAnimeBrowser(1, 48),
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
            newSeasonAnime:
              results[2].status === "fulfilled" ? results[2].value.Page?.media || [] : [],
            topRatedAnime:
              results[3].status === "fulfilled" ? results[3].value.Page?.media || [] : [],
            schedule:
              results[4].status === "fulfilled"
                ? results[4].value.Page?.airingSchedules || []
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

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSlider animes={data.trendingAnime} />

      <section className="container relative z-20 mx-auto -mt-4 px-4 pb-20 pt-12 md:px-6">
        <div className="mb-10">
          <ContinueWatching />
        </div>

        <div className="space-y-16">
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

        <div id="discover" className="scroll-mt-28">
          <AnimeGridTabs 
            newest={data.newSeasonAnime} 
            popular={data.popularAnime} 
            topRated={data.topRatedAnime} 
          />
        </div>

        <div className="pt-6">
          <AiringScheduleTabs
            schedule={data.schedule}
            initialDay={scheduleWindow.selectedDay}
          />
        </div>
        </div>
      </section>
    </div>
  );
}
