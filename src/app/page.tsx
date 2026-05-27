import { HomeClient } from "@/app/home-client";
import { getScheduleWindow } from "@/lib/utils";
import {
  getAiringSchedule,
  getPopularAnime,
  getNewSeasonAnime,
  getTopRatedAnime,
  getTrendingAnime,
  getUpcomingAnime,
} from "@/services/anilist";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const scheduleWindow = getScheduleWindow(params.day);
  const [trending, popular, newSeason, topRated, upcoming, schedule] = await Promise.all([
    getTrendingAnime(1, 10),
    getPopularAnime(1, 48),
    getNewSeasonAnime(1, 48),
    getTopRatedAnime(1, 48),
    getUpcomingAnime(1, 15),
    getAiringSchedule({
      page: 1,
      perPage: 50,
      airingAtGreater: scheduleWindow.start,
      airingAtLesser: scheduleWindow.end,
    }),
  ]);

  return (
    <HomeClient
      day={params.day}
      initialData={{
        trendingAnime: trending?.Page?.media || [],
        popularAnime: popular?.Page?.media || [],
        newSeasonAnime: newSeason?.Page?.media || [],
        topRatedAnime: topRated?.Page?.media || [],
        upcomingAnime: upcoming?.Page?.media || [],
        schedule: schedule?.Page?.airingSchedules || [],
      }}
    />
  );
}
