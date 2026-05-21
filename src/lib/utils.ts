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
