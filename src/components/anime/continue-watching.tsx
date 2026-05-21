"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Trash2, History } from "lucide-react";
import { getWatchHistory, removeWatchHistory, WatchHistoryItem } from "@/lib/history-db";
import { Button } from "@/components/ui/button";

export function ContinueWatching() {
  const [historyList, setHistoryList] = useState<WatchHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      const history = await getWatchHistory();
      setHistoryList(history);
      setLoaded(true);
    }
    loadHistory();
  }, []);

  async function handleDelete(e: React.MouseEvent, animeId: number) {
    e.preventDefault(); // Prevent navigating to the watch page
    e.stopPropagation();
    await removeWatchHistory(animeId);
    setHistoryList((prev) => prev.filter((item) => item.animeId !== animeId));
  }

  if (!loaded || historyList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold tracking-tight text-white/95">
          Lanjutkan Menonton
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {historyList.map((item) => (
          <div
            key={item.animeId}
            className="group relative w-[260px] sm:w-[280px] md:w-[300px] flex-none snap-start"
          >
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, item.animeId)}
              className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:bg-red-500/90 hover:text-white hover:border-transparent opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Hapus dari riwayat"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <Link
              href={`/watch/${item.animeId}/${item.episodeNumber}`}
              className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-black/30">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Play hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transform scale-90 transition-transform duration-300 group-hover:scale-100">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                  EPISODE {item.episodeNumber}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <h3 className="line-clamp-1 text-sm font-semibold text-white/90 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Terakhir ditonton: {new Date(item.watchedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
