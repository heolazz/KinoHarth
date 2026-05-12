import { Search } from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { Badge } from "@/components/ui/badge";
import { Anime, searchAnime } from "@/services/anilist";

type SearchPageData = {
  Page?: {
    pageInfo?: {
      total?: number;
      currentPage?: number;
      hasNextPage?: boolean;
    };
    media?: Anime[];
  };
};

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return value?.trim() || "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = normalizeSearchParam((await searchParams).q);
  const data: SearchPageData | null = query
    ? await searchAnime(query, 1, 24)
    : null;
  const results = data?.Page?.media || [];
  const total = data?.Page?.pageInfo?.total || results.length;

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
                ? `${total} anime matched your search. Pick a title to open details or jump into the dummy watch flow.`
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

        {query && results.length === 0 && (
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
