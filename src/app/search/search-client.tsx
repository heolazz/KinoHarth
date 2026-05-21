"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { Badge } from "@/components/ui/badge";
import type { Anime } from "@/services/anilist";
import { searchAnimeBrowser } from "@/services/anilist-browser";

type SearchState = {
  key: string;
  results: Anime[];
  total: number;
  error: string | null;
};

export function SearchClient({
  query,
  initialData,
}: {
  query: string;
  initialData?: {
    results: Anime[];
    total: number;
  } | null;
}) {
  const [state, setState] = useState<SearchState | null>(() =>
    query && initialData
      ? {
          key: query,
          results: initialData.results,
          total: initialData.total,
          error: null,
        }
      : null
  );

  useEffect(() => {
    let cancelled = false;

    if (!query) {
      return;
    }

    searchAnimeBrowser(query, 1, 24)
      .then((data) => {
        if (cancelled) return;
        const media = data.Page?.media || [];
        setState({
          key: query,
          results: media,
          total: data.Page?.pageInfo?.total || media.length,
          error: null,
        });
      })
      .catch((caught) => {
        if (!cancelled) {
          setState({
            key: query,
            results: [],
            total: 0,
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const results = query && state?.key === query ? state.results : [];
  const total = query && state?.key === query ? state.total : 0;
  const error = query && state?.key === query ? state.error : null;
  const isLoading = Boolean(query && state?.key !== query);

  return (
    <div className="min-h-screen bg-[#1c1c1c] px-4 pb-20 pt-28 text-white md:px-8 lg:px-12">
      <section className="container space-y-10">
        <div className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="bg-white/10 text-white">
            Search
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {query ? `Results for "${query}"` : "Find your next anime"}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
              {query
                ? `${total} anime matched your search. Pick a title to open details or jump into the watch flow.`
                : "Use the search bar in the navigation to explore anime by title."}
            </p>
          </div>
        </div>

        {!query && (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Search className="h-7 w-7 text-white/70" />
            </div>
            <h2 className="text-2xl font-semibold">Start with a title</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Try searching for Naruto, One Piece, Frieren, or any anime you
              want to inspect.
            </p>
          </div>
        )}

        {query && isLoading && <AnimeLoading title="Searching AniList" />}
        {query && error && <AnimeError message={error} />}

        {query && !isLoading && !error && results.length === 0 && (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Search className="h-7 w-7 text-white/70" />
            </div>
            <h2 className="text-2xl font-semibold">No results found</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Check the spelling or try a broader anime title.
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
      </section>
    </div>
  );
}
