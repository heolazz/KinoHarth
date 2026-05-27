"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "./anime-card";
import { Anime } from "@/services/anilist";

interface AnimeGridTabsProps {
  newest: Anime[];
  popular: Anime[];
  topRated: Anime[];
}

export function AnimeGridTabs({ newest, popular, topRated }: AnimeGridTabsProps) {
  const [activeTab, setActiveTab] = useState<"newest" | "popular" | "topRated">("newest");
  const [page, setPage] = useState(1);
  const [cols, setCols] = useState(6);
  
  useEffect(() => {
    const update = () => setCols(window.innerWidth < 480 ? 2 : 6);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const dataMap = {
    newest,
    popular,
    topRated
  };
  
  const currentData = dataMap[activeTab] || [];
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));
  const displayData = currentData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleTabChange = (tab: "newest" | "popular" | "topRated") => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex w-full sm:w-auto bg-white/[0.02] rounded-md border border-white/5 overflow-x-auto hide-scrollbar shrink-0">
          <button 
            onClick={() => handleTabChange("newest")}
            className={`flex-1 sm:flex-none px-4 md:px-7 py-3 md:py-3.5 text-[11px] md:text-[13px] font-bold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === "newest" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            NEWEST
          </button>
          <button 
            onClick={() => handleTabChange("popular")}
            className={`flex-1 sm:flex-none px-4 md:px-7 py-3 md:py-3.5 text-[11px] md:text-[13px] font-bold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === "popular" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            POPULAR
          </button>
          <button 
            onClick={() => handleTabChange("topRated")}
            className={`flex-1 sm:flex-none px-4 md:px-7 py-3 md:py-3.5 text-[11px] md:text-[13px] font-bold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === "topRated" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            TOP RATED
          </button>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/[0.02] rounded-md border border-white/5 px-2 py-1 w-full sm:w-auto">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-white/70 min-w-[1.5rem] text-center">
            {page} / {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid — uses JS-detected columns for guaranteed iPad compatibility */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: cols === 2 ? "0.75rem" : "1rem",
        }}
      >
        {displayData.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} variant="grid" />
        ))}
      </div>
    </div>
  );
}
