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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <History className="h-4.5 w-4.5 text-primary/90" />
        <h2 className="text-lg font-bold tracking-tight text-white/90">
          Lanjutkan Menonton
        </h2>
      </div>

      <div className="flex flex-wrap gap-4 pb-2">
        {historyList.map((item) => (
          <div
            key={item.animeId}
            className="group relative w-[180px] sm:w-[200px] md:w-[220px] flex-none"
          >
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, item.animeId)}
              className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:bg-red-500/90 hover:text-white hover:border-transparent opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Hapus dari riwayat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <Link
              href={`/watch/${item.animeId}/${item.episodeNumber}`}
              className="block overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-2 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:-translate-y-0.5"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-black/30">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                
                {/* Play hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg transform scale-90 transition-transform duration-300 group-hover:scale-100">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-black text-white shadow-md">
                  EP {item.episodeNumber}
                </div>
              </div>

              <div className="mt-2 space-y-0.5 px-0.5">
                <h3 className="line-clamp-1 text-xs font-semibold text-white/80 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] text-white/40">
                  {new Date(item.watchedAt).toLocaleDateString("id-ID", {
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
