"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film, Search, ChevronDown } from "lucide-react";
import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import type { AnimePageResponse } from "@/services/anilist";
import { getAnimeByStudioBrowser } from "@/services/anilist-browser";

export function StudioClient({
  studioId,
  studio,
  initialData,
}: {
  studioId: number;
  studio?: { name: string; logoText: string; color: string; cover: string };
  initialData?: AnimePageResponse | null;
}) {
  const [page, setPage] = useState(1);
  const [results, setResults] = useState(() => {
    const media = initialData?.Page?.media || [];
    const seen = new Set();
    return media.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  });
  const [hasNextPage, setHasNextPage] = useState(
    initialData?.Page?.pageInfo?.hasNextPage || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback: if server-side fetch failed (e.g. Cloudflare Workers blocked by AniList),
  // fetch initial data client-side from the user's browser
  useEffect(() => {
    if (results.length > 0) return;
    let cancelled = false;
    setIsLoading(true);

    getAnimeByStudioBrowser(studioId, 1, 24)
      .then((data) => {
        if (cancelled) return;
        const media = data.Page?.media || [];
        const seen = new Set<number>();
        setResults(
          media.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          })
        );
        setHasNextPage(data.Page?.pageInfo?.hasNextPage || false);
        setIsLoading(false);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : String(caught));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studioId]);

  // Load more pages
  useEffect(() => {
    if (page === 1) return;

    let cancelled = false;
    setIsLoading(true);

    getAnimeByStudioBrowser(studioId, page, 24)
      .then((data) => {
        if (cancelled) return;
        const media = data.Page?.media || [];
        setResults((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newMedia = media.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newMedia];
        });
        setHasNextPage(data.Page?.pageInfo?.hasNextPage || false);
        setIsLoading(false);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : String(caught));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, studioId]);

  const totalCount = initialData?.Page?.pageInfo?.total || results.length;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Cinematic Studio Header */}
      <div className="relative w-full h-[45vh] md:h-[55vh] min-h-[320px] flex items-end overflow-hidden">
        {/* Background Cover */}
        {studio?.cover && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
            style={{ backgroundImage: `url(${studio.cover})` }}
          />
        )}

        {/* Multi-layer gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/40 to-transparent" />
        {studio?.color && (
          <div className={`absolute inset-0 bg-gradient-to-br ${studio.color} to-transparent opacity-15`} />
        )}

        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-20 md:top-24 left-4 md:left-8 lg:left-12 z-20 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-black/60 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-4 pb-10 md:px-8 lg:px-12">
          <div className="container mx-auto">
            {/* Studio badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white/90 border border-white/10">
              <Film className="h-3 w-3" />
              Animation Studio
            </div>
            
            {/* Studio Name */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight drop-shadow-2xl uppercase leading-none">
              {studio?.name || "Studio Anime"}
            </h1>
            
            {/* Meta info */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <p className="max-w-xl text-sm md:text-base text-white/60 leading-relaxed">
                Explore the most popular and highly rated anime produced by {studio?.name || "this studio"}.
              </p>
              {totalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {totalCount}+ titles
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <section className="container px-4 md:px-8 lg:px-12 pt-8 pb-20">
        {error && <AnimeError message={error} />}

        {isLoading && results.length === 0 && (
          <div className="mt-8">
            <AnimeLoading title={`Loading ${studio?.name || "studio"} anime...`} />
          </div>
        )}

        {!error && results.length === 0 && !isLoading && (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Search className="h-7 w-7 text-white/70" />
            </div>
            <h2 className="text-2xl font-semibold">No anime found</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              We couldn&apos;t find any anime by this studio.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-5">
            {results.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}

        {isLoading && results.length > 0 && (
          <div className="mt-12">
            <AnimeLoading title="Loading more anime..." />
          </div>
        )}

        {hasNextPage && !isLoading && !error && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-8 py-3 font-medium text-white/90 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-white/5"
            >
              <span>Load More</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </div>
        )}
      </section>

      {/* Slow zoom animation */}
      <style jsx global>{`
        @keyframes slowZoom {
          0% { transform: scale(1.05); }
          100% { transform: scale(1.12); }
        }
      `}</style>
    </div>
  );
}
