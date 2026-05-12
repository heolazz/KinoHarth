import Link from "next/link";
import { CalendarClock, Clock, Tv } from "lucide-react";

import type { AiringScheduleItem } from "@/services/anilist";

const scheduleDays = [
  { label: "Monday", short: "Mon", value: 1 },
  { label: "Tuesday", short: "Tue", value: 2 },
  { label: "Wednesday", short: "Wed", value: 3 },
  { label: "Thursday", short: "Thu", value: 4 },
  { label: "Friday", short: "Fri", value: 5 },
  { label: "Saturday", short: "Sat", value: 6 },
  { label: "Sunday", short: "Sun", value: 0 },
];

function formatScheduleTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

function formatScheduleCountdown(seconds: number) {
  if (seconds <= 0) return "Aired";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function AiringScheduleTabs({
  schedule,
  initialDay,
}: {
  schedule: AiringScheduleItem[];
  initialDay: number;
}) {
  const today = new Date().getDay();

  return (
    <div id="schedule" className="space-y-8 scroll-mt-28">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Airing Schedule
        </h2>
        <p className="mt-1.5 text-sm text-white/45">
          Upcoming episodes airing this week
        </p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {scheduleDays.map((day) => {
          const isActive = initialDay === day.value;
          const isToday = today === day.value;

          return (
            <Link
              key={day.value}
              href={`/?day=${day.value}#schedule`}
              scroll={false}
              prefetch={true}
              className={`relative flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 cursor-pointer ${
                isActive
                  ? "border-white/20 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                  : "border-white/5 bg-white/[0.03] text-white/50 hover:border-white/10 hover:bg-white/[0.06] hover:text-white/80"
              }`}
            >
              <span className="font-bold md:hidden">{day.short}</span>
              <span className="hidden font-bold md:inline">{day.label}</span>
              {isToday && (
                <span
                  className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-black/30" : "bg-emerald-400/60"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Schedule Grid */}
      {schedule.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {schedule.map((item) => {
            const title =
              item.media.title.english ||
              item.media.title.romaji ||
              item.media.title.native;
            const isAired = item.timeUntilAiring <= 0;

            return (
              <Link
                key={item.id}
                href={`/anime/${item.media.id}`}
                className="group relative flex gap-3.5 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                {/* Cover Image */}
                <div className="relative h-[5.5rem] w-[3.75rem] flex-shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={item.media.coverImage.medium}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white/85 transition-colors group-hover:text-white">
                    {title}
                  </h3>

                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-white/45">
                      <CalendarClock className="h-3 w-3" />
                      Ep {item.episode}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-white/45">
                      <Clock className="h-3 w-3" />
                      {formatScheduleTime(item.airingAt)}
                    </span>
                    <span
                      className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isAired
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-white/5 text-white/50"
                      }`}
                    >
                      {formatScheduleCountdown(item.timeUntilAiring)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Tv className="h-8 w-8 text-white/15" />
          <p className="text-sm text-white/40">
            No episodes scheduled for this day
          </p>
        </div>
      )}
    </div>
  );
}
