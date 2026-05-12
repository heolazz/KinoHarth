import Link from "next/link";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAnimeCatalog } from "@/services/anilist";

const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance"];
const statuses = [
  { label: "Airing", value: "RELEASING" },
  { label: "Finished", value: "FINISHED" },
  { label: "Upcoming", value: "NOT_YET_RELEASED" },
];
const formats = ["TV", "MOVIE", "ONA", "OVA"];

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return value?.trim() || "";
}

function createHref(
  current: Record<string, string>,
  updates: Record<string, string | null>
) {
  const params = new URLSearchParams();
  const merged = { ...current };

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      merged[key] = value;
    } else {
      delete merged[key];
    }
  });

  Object.entries(merged).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/anime?${query}` : "/anime";
}

export default async function AnimeCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    genre?: string | string[];
    status?: string | string[];
    format?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = readParam(params.q);
  const activeGenre = readParam(params.genre);
  const activeStatus = readParam(params.status);
  const activeFormat = readParam(params.format);
  const page = Math.max(Number(readParam(params.page)) || 1, 1);

  const currentParams = {
    q: query,
    genre: activeGenre,
    status: activeStatus,
    format: activeFormat,
  };

  const data = await getAnimeCatalog({
    page,
    perPage: 24,
    search: query || undefined,
    genre: activeGenre || undefined,
    status: activeStatus || undefined,
    format: activeFormat || undefined,
  });
  const anime = data.Page?.media || [];
  const pageInfo = data.Page?.pageInfo;
  const total = pageInfo?.total || anime.length;
  const hasActiveFilters = Boolean(query || activeGenre || activeStatus || activeFormat);

  return (
    <div className="min-h-screen bg-[#1c1c1c] px-4 pb-20 pt-28 text-white md:px-8 lg:px-12">
      <section className="container space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge variant="secondary" className="bg-white/10 text-white">
              Catalog
            </Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Browse anime
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
                Explore popular anime with quick filters. The controls already
                shape the URL, so this page is ready to grow into a richer
                catalog later.
              </p>
            </div>
          </div>

          <form action="/anime" className="relative w-full max-w-md">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search catalog ..."
              className="h-12 w-full rounded-full border border-white/10 bg-white/10 px-5 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/50 focus:border-white/30"
            />
            <input type="hidden" name="genre" value={activeGenre} />
            <input type="hidden" name="status" value={activeStatus} />
            <input type="hidden" name="format" value={activeFormat} />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/60 transition-colors hover:text-white"
              aria-label="Search catalog"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </h2>
            {hasActiveFilters && (
              <Link
                href="/anime"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
                Clear
              </Link>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
                <Filter className="h-4 w-4" />
                Genre
              </p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const isActive = activeGenre === genre;

                  return (
                    <Link
                      key={genre}
                      href={createHref(currentParams, {
                        genre: isActive ? null : genre,
                        page: null,
                      })}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      {genre}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/70">Status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => {
                  const isActive = activeStatus === status.value;

                  return (
                    <Link
                      key={status.value}
                      href={createHref(currentParams, {
                        status: isActive ? null : status.value,
                        page: null,
                      })}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      {status.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/70">Format</p>
              <div className="flex flex-wrap gap-2">
                {formats.map((format) => {
                  const isActive = activeFormat === format;

                  return (
                    <Link
                      key={format}
                      href={createHref(currentParams, {
                        format: isActive ? null : format,
                        page: null,
                      })}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      {format}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/55">
            Showing {anime.length} of {total} results
          </p>
          <div className="flex items-center gap-3">
            <Button
              render={page > 1 ? <Link href={createHref(currentParams, { page: String(page - 1) })} /> : undefined}
              variant="outline"
              className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              render={
                pageInfo?.hasNextPage ? (
                  <Link href={createHref(currentParams, { page: String(page + 1) })} />
                ) : undefined
              }
              className="rounded-full bg-white text-black hover:bg-white/90"
              disabled={!pageInfo?.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>

        {anime.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {anime.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-2xl font-semibold">No anime found</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Try clearing a filter or using a broader search term.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
