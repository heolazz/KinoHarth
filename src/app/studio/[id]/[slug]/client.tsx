"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { Badge } from "@/components/ui/badge";
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
  const [results, setResults] = useState(initialData?.Page?.media || []);
  const [hasNextPage, setHasNextPage] = useState(
    initialData?.Page?.pageInfo?.hasNextPage || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (page === 1) return; // Handled by initialData

    let cancelled = false;
    setIsLoading(true);

    getAnimeByStudioBrowser(studioId, page, 24)
      .then((data) => {
        if (cancelled) return;
        const media = data.Page?.media || [];
        setResults((prev) => [...prev, ...media]);
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

  return (
    <div className="min-h-screen bg-[#1c1c1c] pb-20 text-white">
      {/* Studio Header */}
      <div className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px] mb-12 flex items-center justify-center overflow-hidden">
        {studio?.cover && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${studio.cover})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-[#1c1c1c]/80 to-[#1c1c1c]/30" />
        {studio?.color && (
          <div className={`absolute inset-0 bg-gradient-to-r ${studio.color} opacity-20`} />
        )}
        
        <div className="relative z-10 text-center px-4">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white">
            Studio
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-xl uppercase">
            {studio?.name || "Studio Anime"}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
            Explore the most popular and highly rated anime produced by {studio?.name || "this studio"}.
          </p>
        </div>
      </div>

      <section className="container px-4 md:px-8 lg:px-12">
        {error && <AnimeError message={error} />}

        {!error && results.length === 0 && !isLoading && (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Search className="h-7 w-7 text-white/70" />
            </div>
            <h2 className="text-2xl font-semibold">No anime found</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              We couldn't find any anime by this studio.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="mt-12">
            <AnimeLoading title="Loading more anime..." />
          </div>
        )}

        {hasNextPage && !isLoading && !error && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full bg-white/10 px-8 py-3 font-medium text-white transition-colors hover:bg-white/20"
            >
              Load More
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
