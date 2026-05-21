import { HomeClient } from "@/app/home-client";
import { getScheduleWindow } from "@/lib/utils";
import {
  getAiringSchedule,
  getPopularAnime,
  getRecentlyUpdatedAnime,
  getTrendingAnime,
} from "@/services/anilist";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const scheduleWindow = getScheduleWindow(params.day);
  const [trending, popular, recentlyUpdated, schedule] = await Promise.all([
    getTrendingAnime(1, 10),
    getPopularAnime(1, 12),
    getRecentlyUpdatedAnime(1, 9),
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
        recentlyUpdatedAnime: recentlyUpdated?.Page?.media || [],
        schedule: schedule?.Page?.airingSchedules || [],
      }}
    />
  );
}
