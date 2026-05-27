"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";
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
      // Limit to a maximum of 12 most recent items
      setHistoryList(history.slice(0, 12));
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
      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
        Watch History
      </h2>

      <div className="relative group/slider">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-5 top-1/2 z-40 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:bg-white hover:text-black hover:scale-105 shadow-xl opacity-0 group-hover/slider:opacity-100"
            title="Scroll Left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-5 top-1/2 z-40 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-md transition-all hover:bg-white hover:text-black hover:scale-105 shadow-xl opacity-0 group-hover/slider:opacity-100"
            title="Scroll Right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth"
        >
          {historyList.map((item) => (
            <div
              key={item.animeId}
              className="group relative w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] flex-none snap-start"
            >
              <Link
                href={`/watch/${item.animeId}/${item.episodeNumber}`}
                className="block outline-none"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#111111] shadow-lg ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-1">
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, item.animeId)}
                    className="absolute right-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md transition-all hover:bg-black/80 hover:text-white"
                    title="Remove from history"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  <img
                    src={item.poster}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
                  
                  {/* Play hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transform scale-90 transition-transform duration-300 group-hover:scale-100">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </div>
                  </div>

                  {/* EP Badge */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                    EP {item.episodeNumber}
                  </div>
                  
                  {/* Fake Red Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                     <div className="h-full bg-red-600" style={{ width: "90%" }} />
                  </div>
                </div>

                <div className="mt-2.5 px-0.5">
                  <h3 className="line-clamp-1 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
