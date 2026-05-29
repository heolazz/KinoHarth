"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProxiedImageUrl } from "@/lib/utils";

export type EpisodeBrowserItem = {
  number: number;
  title: string;
  thumbnail: string;
  site?: string;
  href: string;
};

function filterEpisodes(episodes: EpisodeBrowserItem[], searchTerm: string) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return episodes;
  }

  return episodes.filter(
    (episode) =>
      String(episode.number).includes(query) ||
      episode.title.toLowerCase().includes(query)
  );
}

export function EpisodeBrowser({ episodes }: { episodes: EpisodeBrowserItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const episodesPerPage = isMobile ? 10 : 20;

  const filteredEpisodes = useMemo(
    () => filterEpisodes(episodes, searchTerm),
    [episodes, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filteredEpisodes.length / episodesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const firstEpisodeIndex = (safePage - 1) * episodesPerPage;
  const visibleEpisodes = filteredEpisodes.slice(
    firstEpisodeIndex,
    firstEpisodeIndex + episodesPerPage
  );

  function handleSearch(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  return (
    <div className="mt-16 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Episodes</h2>

        <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search episode number or title"
              className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/50">
        <span>
          {filteredEpisodes.length} of {episodes.length} episodes
        </span>
        {totalPages > 1 && (
          <span>
            Page {safePage} of {totalPages}
          </span>
        )}
      </div>

      {visibleEpisodes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleEpisodes.map((episode) => (
            <Link
              key={episode.number}
              href={episode.href}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="relative aspect-video overflow-hidden bg-black/30">
                <img
                  src={getProxiedImageUrl(episode.thumbnail)}
                  alt={episode.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  EP {episode.number}
                </div>
              </div>

              <div className="space-y-1.5 p-4">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-primary">
                  {episode.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {episode.site ? `Source: ${episode.site}` : "TMDB preview"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
          No episodes match your search.
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - safePage) <= 1
            )
            .map((page, index, pages) => {
              const previousPage = pages[index - 1];
              const needsGap = previousPage && page - previousPage > 1;

              return (
                <span key={page} className="flex items-center gap-2">
                  {needsGap && <span className="text-sm text-white/35">...</span>}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors ${
                      page === safePage
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              );
            })}

          <Button
            type="button"
            className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
