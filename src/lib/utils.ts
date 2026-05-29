import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScheduleWindow(dayParam?: string) {
  const now = new Date();
  const currentDay = now.getDay();
  const selectedDay = dayParam ? parseInt(dayParam, 10) : currentDay;
  const currentDayIso = currentDay === 0 ? 7 : currentDay;
  const selectedDayIso = selectedDay === 0 ? 7 : selectedDay;
  const targetDate = new Date(now);

  targetDate.setDate(now.getDate() - currentDayIso + selectedDayIso);
  targetDate.setHours(0, 0, 0, 0);

  return {
    start: Math.floor(targetDate.getTime() / 1000),
    end: Math.floor(targetDate.getTime() / 1000) + 24 * 60 * 60,
    selectedDay,
  };
}

export function getProxiedImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // Do not proxy if it's an AniList image (which is already fast and unblocked) 
  // or if it's already proxied.
  if (url.includes("s4.anilist.co") || url.includes("wsrv.nl")) {
    return url;
  }
  
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
}
