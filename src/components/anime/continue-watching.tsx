"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Play, Trash2, History, ChevronLeft, ChevronRight } from "lucide-react";
import { getWatchHistory, removeWatchHistory, WatchHistoryItem } from "@/lib/history-db";

export function ContinueWatching() {
  const [historyList, setHistoryList] = useState<WatchHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const history = await getWatchHistory();
      // Limit to a maximum of 8 most recent items
      setHistoryList(history.slice(0, 8));
      setLoaded(true);
    }
    loadHistory();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    };

    // Initial check after rendering
    const timer = setTimeout(checkScroll, 100);

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [loaded, historyList]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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

      <div className="relative group/slider">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 z-40 -translate-y-1/2 hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:bg-white hover:text-black hover:scale-105 shadow-xl opacity-0 group-hover/slider:opacity-100"
            title="Gulir Kiri"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 z-40 -translate-y-1/2 hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:bg-white hover:text-black hover:scale-105 shadow-xl opacity-0 group-hover/slider:opacity-100"
            title="Gulir Kanan"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth"
        >
          {historyList.map((item) => (
            <div
              key={item.animeId}
              className="group relative w-[180px] sm:w-[200px] md:w-[220px] flex-none snap-start"
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
    </div>
  );
}
