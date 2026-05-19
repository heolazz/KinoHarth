"use client";

import { useEffect } from "react";
import { saveWatchHistory } from "@/lib/history-db";

interface HistorySaverProps {
  animeId: number;
  title: string;
  poster: string;
  episodeNumber: number;
}

export function HistorySaver({ animeId, title, poster, episodeNumber }: HistorySaverProps) {
  useEffect(() => {
    saveWatchHistory({
      animeId,
      title,
      poster,
      episodeNumber,
    });
  }, [animeId, title, poster, episodeNumber]);

  return null; // This component is invisible and only executes background DB work
}
