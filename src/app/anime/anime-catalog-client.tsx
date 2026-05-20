"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Anime, AnimePageInfo } from "@/services/anilist";
import { getAnimeCatalogBrowser } from "@/services/anilist-browser";

const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance"];
const statuses = [
  { label: "Airing", value: "RELEASING" },
  { label: "Finished", value: "FINISHED" },
  { label: "Upcoming", value: "NOT_YET_RELEASED" },
];
const formats = ["TV", "MOVIE", "ONA", "OVA"];

type CatalogParams = {
  q: string;
  genre: string;
  status: string;
  format: string;
  page: number;
};

type CatalogState = {
  key: string;
  anime: Anime[];
  pageInfo?: AnimePageInfo;
  error: string | null;
};

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

export function AnimeCatalogClient({ params }: { params: CatalogParams }) {
  const requestKey = JSON.stringify(params);
  const [state, setState] = useState<CatalogState | null>(null);

  const currentParams = {
    q: params.q,
    genre: params.genre,
    status: params.status,
    format: params.format,
  };
  const hasActiveFilters = Boolean(
    params.q || params.genre || params.status || params.format
  );

  useEffect(() => {
    let cancelled = false;

    getAnimeCatalogBrowser({
      page: params.page,
      perPage: 24,
      search: params.q || undefined,
      genre: params.genre || undefined,
      status: params.status || undefined,
      format: params.format || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setState({
          key: requestKey,
          anime: data.Page?.media || [],
          pageInfo: data.Page?.pageInfo,
          error: null,
        });
      })
      .catch((caught) => {
        if (!cancelled) {
          setState({
            key: requestKey,
            anime: [],
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.format, params.genre, params.page, params.q, params.status, requestKey]);

  const isLoading = state?.key !== requestKey;
  const anime = state?.key === requestKey ? state.anime : [];
  const pageInfo = state?.key === requestKey ? state.pageInfo : undefined;
  const error = state?.key === requestKey ? state.error : null;
  const total = pageInfo?.total || anime.length;

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
                Explore popular anime with quick filters. Data loads directly
                from AniList in the browser to keep Cloudflare stable.
              </p>
            </div>
          </div>

          <form action="/anime" className="relative w-full max-w-md">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search catalog ..."
              className="h-12 w-full rounded-full border border-white/10 bg-white/10 px-5 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/50 focus:border-white/30"
            />
            <input type="hidden" name="genre" value={params.genre} />
            <input type="hidden" name="status" value={params.status} />
            <input type="hidden" name="format" value={params.format} />
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
                prefetch={false}
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
                  const isActive = params.genre === genre;

                  return (
                    <Link
                      key={genre}
                      href={createHref(currentParams, {
                        genre: isActive ? null : genre,
                        page: null,
                      })}
                      prefetch={false}
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
                  const isActive = params.status === status.value;

                  return (
                    <Link
                      key={status.value}
                      href={createHref(currentParams, {
                        status: isActive ? null : status.value,
                        page: null,
                      })}
                      prefetch={false}
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
                  const isActive = params.format === format;

                  return (
                    <Link
                      key={format}
                      href={createHref(currentParams, {
                        format: isActive ? null : format,
                        page: null,
                      })}
                      prefetch={false}
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

        {isLoading ? (
          <AnimeLoading title="Loading catalog" />
        ) : error ? (
          <AnimeError message={error} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white/55">
                Showing {anime.length} of {total} results
              </p>
              <div className="flex items-center gap-3">
                <Button
                  render={
                    params.page > 1 ? (
                      <Link
                        href={createHref(currentParams, {
                          page: String(params.page - 1),
                        })}
                        prefetch={false}
                      />
                    ) : undefined
                  }
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={params.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  render={
                    pageInfo?.hasNextPage ? (
                      <Link
                        href={createHref(currentParams, {
                          page: String(params.page + 1),
                        })}
                        prefetch={false}
                      />
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
          </>
        )}
      </section>
    </div>
  );
}
