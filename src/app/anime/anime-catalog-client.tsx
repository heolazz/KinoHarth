"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
  Grid,
  List,
  RotateCcw,
  ChevronDown,
  Compass,
  Calendar,
  Sparkles,
  Award
} from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError } from "@/components/anime/anime-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Anime, AnimePageInfo } from "@/services/anilist";
import { getAnimeCatalogBrowser } from "@/services/anilist-browser";

const genres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller"
];

const statuses = [
  { label: "Airing", value: "RELEASING" },
  { label: "Finished", value: "FINISHED" },
  { label: "Upcoming", value: "NOT_YET_RELEASED" },
];

const formats = ["TV", "MOVIE", "ONA", "OVA"];

const sortOptions = [
  { label: "Most Popular", value: "POPULARITY_DESC" },
  { label: "Trending", value: "TRENDING_DESC" },
  { label: "Top Rated", value: "SCORE_DESC" },
  { label: "Newest", value: "START_DATE_DESC" },
  { label: "Oldest", value: "START_DATE_ASC" }
];

const seasons = [
  { label: "Winter", value: "WINTER" },
  { label: "Spring", value: "SPRING" },
  { label: "Summer", value: "SUMMER" },
  { label: "Fall", value: "FALL" }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 35 }, (_, i) => String(currentYear - i + 1)); // Includes next year too for upcoming items

type CatalogParams = {
  q: string;
  genre: string;
  status: string;
  format: string;
  sort: string;
  season: string;
  year: string;
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

function AnimeListItem({ anime }: { anime: Anime }) {
  const title = anime.title.english || anime.title.romaji || anime.title.native;
  // Clean description from HTML tags
  const cleanDescription = anime.description
    ? anime.description.replace(/<[^>]*>/g, "").trim()
    : "No description available.";

  return (
    <Link
      href={`/anime/${anime.id}`}
      prefetch={false}
      className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.01] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[3/4] w-24 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-black/40">
        <img
          src={anime.coverImage.large || anime.coverImage.medium}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
          loading="lazy"
        />
        {anime.averageScore && (
          <div className="absolute left-2 top-2 rounded bg-black/60 border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur-sm">
            ⭐ {anime.averageScore}%
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-white/90 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-white/50">
            <span className="rounded bg-white/5 px-2 py-0.5 font-medium">{anime.format}</span>
            {anime.season && (
              <span className="rounded bg-white/5 px-2 py-0.5 capitalize">
                {anime.season.toLowerCase()} {anime.seasonYear}
              </span>
            )}
            {anime.episodes && (
              <span className="rounded bg-white/5 px-2 py-0.5">
                {anime.episodes} EPS
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-white/40">
            {cleanDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mt-2.5">
          {anime.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="rounded-full bg-white/[0.02] px-2.5 py-0.5 text-[10px] text-white/40 border border-white/5"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCatalogClient({
  params,
  initialData,
}: {
  params: CatalogParams;
  initialData?: {
    anime: Anime[];
    pageInfo?: AnimePageInfo;
  } | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const requestKey = JSON.stringify(params);

  const [state, setState] = useState<CatalogState | null>(() =>
    initialData
      ? {
        key: requestKey,
        anime: initialData.anime,
        pageInfo: initialData.pageInfo,
        error: null,
      }
      : null
  );

  const [searchVal, setSearchVal] = useState(params.q);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentParams = {
    q: params.q,
    genre: params.genre,
    status: params.status,
    format: params.format,
    sort: params.sort,
    season: params.season,
    year: params.year,
  };

  const activeFilterCount = [
    params.genre,
    params.status,
    params.format,
    params.sort,
    params.season,
    params.year
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    params.q || params.genre || params.status || params.format || params.sort || params.season || params.year
  );

  // Sync Search state with Params
  useEffect(() => {
    setSearchVal(params.q);
  }, [params.q]);

  // Dynamic Browser Fetching on params update
  useEffect(() => {
    let cancelled = false;

    getAnimeCatalogBrowser({
      page: params.page,
      perPage: 24,
      search: params.q || undefined,
      genre: params.genre || undefined,
      status: params.status || undefined,
      format: params.format || undefined,
      sort: params.sort ? [params.sort] : undefined,
      season: params.season || undefined,
      seasonYear: params.year ? Number(params.year) : undefined,
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
  }, [
    params.format,
    params.genre,
    params.page,
    params.q,
    params.status,
    params.sort,
    params.season,
    params.year,
    requestKey
  ]);

  // Debounced search submit
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchVal(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(createHref(currentParams, { q: value || null, page: null }), { scroll: false });
      });
    }, 450);
  };

  const handleFilterUpdate = (updates: Record<string, string | null>) => {
    startTransition(() => {
      router.push(createHref(currentParams, { ...updates, page: null }), { scroll: false });
    });
  };

  const clearAllFilters = () => {
    setSearchVal("");
    startTransition(() => {
      router.push("/anime", { scroll: false });
    });
  };

  const isLoading = state?.key !== requestKey;
  const anime = state?.key === requestKey ? state.anime : [];
  const pageInfo = state?.key === requestKey ? state.pageInfo : undefined;
  const error = state?.key === requestKey ? state.error : null;
  const total = pageInfo?.total || anime.length;

  return (
    <div className="min-h-screen bg-[#141414] px-4 pb-20 pt-28 text-white md:px-8 lg:px-12">
      <section className="container space-y-8">

        {/* Header Block */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border border-primary/20 font-bold px-3 py-0.5">
                Catalog
              </Badge>
              {activeFilterCount > 0 && (
                <span className="text-xs text-white/40">
                  • {activeFilterCount} active filters
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Discover Anime
            </h1>
            <p className="max-w-xl text-xs sm:text-sm text-white/50">
              Explore thousands of anime by genre, format, release status, season, and year instantly.
            </p>
          </div>

          <div className="relative w-full max-w-md shrink-0">
            <div className="relative">
              <input
                value={searchVal}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search anime titles..."
                className="h-11 w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-5 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-primary/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              {searchVal && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Catalog Main Layout */}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="flex items-center gap-2 text-md font-bold tracking-tight">
                <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                Search Filters
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Sort Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={params.sort || "POPULARITY_DESC"}
                    onChange={(e) => handleFilterUpdate({ sort: e.target.value })}
                    className="w-full h-10 appearance-none rounded-xl border border-white/5 bg-white/[0.03] px-3.5 pr-10 text-sm text-white/80 outline-none transition-all focus:border-primary/50"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1c1c1c] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Release Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((status) => {
                    const isActive = params.status === status.value;
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleFilterUpdate({ status: isActive ? null : status.value })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${isActive
                            ? "bg-primary border-transparent text-primary-foreground font-bold shadow"
                            : "bg-white/[0.02] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                          }`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Format
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {formats.map((fmt) => {
                    const isActive = params.format === fmt;
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleFilterUpdate({ format: isActive ? null : fmt })}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all ${isActive
                            ? "bg-primary border-transparent text-primary-foreground font-bold shadow"
                            : "bg-white/[0.02] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                          }`}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Season & Year Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                    Season
                  </label>
                  <div className="relative">
                    <select
                      value={params.season || ""}
                      onChange={(e) => handleFilterUpdate({ season: e.target.value || null })}
                      className="w-full h-9 appearance-none rounded-xl border border-white/5 bg-white/[0.03] px-3 pr-8 text-xs text-white/80 outline-none transition-all focus:border-primary/50"
                    >
                      <option value="">All</option>
                      {seasons.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#1c1c1c] text-white">
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                    Year
                  </label>
                  <div className="relative">
                    <select
                      value={params.year || ""}
                      onChange={(e) => handleFilterUpdate({ year: e.target.value || null })}
                      className="w-full h-9 appearance-none rounded-xl border border-white/5 bg-white/[0.03] px-3 pr-8 text-xs text-white/80 outline-none transition-all focus:border-primary/50"
                    >
                      <option value="">All</option>
                      {years.map((y) => (
                        <option key={y} value={y} className="bg-[#1c1c1c] text-white">
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Anime Genre
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[320px] overflow-y-auto pr-1 hide-scrollbar">
                  {genres.map((genre) => {
                    const isActive = params.genre === genre;
                    return (
                      <button
                        key={genre}
                        onClick={() => handleFilterUpdate({ genre: isActive ? null : genre })}
                        className={`rounded-lg px-2.5 py-1.5 text-xs border transition-all ${isActive
                            ? "bg-primary border-transparent text-primary-foreground font-bold shadow"
                            : "bg-white/[0.01] border-white/5 text-white/50 hover:border-white/10 hover:text-white"
                          }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <main className="space-y-6">

            {/* Top Toolbar (Mobile trigger, view toggles, count) */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2 text-xs font-bold text-white/90 hover:bg-white/[0.06] active:scale-95 transition-all"
                >
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>

                <p className="text-xs sm:text-sm text-white/40">
                  {isLoading ? "Searching..." : `Showing ${anime.length} of ${total.toLocaleString("en-US")} anime`}
                </p>
              </div>

              {/* Grid vs List View toggle */}
              <div className="flex items-center gap-1 rounded-xl bg-white/[0.02] border border-white/5 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-1.5 transition-all ${viewMode === "grid"
                      ? "bg-white/10 text-primary"
                      : "text-white/40 hover:text-white"
                    }`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-1.5 transition-all ${viewMode === "list"
                      ? "bg-white/10 text-primary"
                      : "text-white/40 hover:text-white"
                    }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Active Pills Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider mr-1">Active Filters:</span>
                {params.genre && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                    Genre: {params.genre}
                    <button onClick={() => handleFilterUpdate({ genre: null })} className="p-0.5 rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {params.status && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                    Status: {statuses.find(s => s.value === params.status)?.label || params.status}
                    <button onClick={() => handleFilterUpdate({ status: null })} className="p-0.5 rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {params.format && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                    Format: {params.format}
                    <button onClick={() => handleFilterUpdate({ format: null })} className="p-0.5 rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {params.season && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                    Season: {seasons.find(s => s.value === params.season)?.label || params.season}
                    <button onClick={() => handleFilterUpdate({ season: null })} className="p-0.5 rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {params.year && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                    Year: {params.year}
                    <button onClick={() => handleFilterUpdate({ year: null })} className="p-0.5 rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {params.sort && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 py-1 pl-2.5 pr-1.5 flex items-center gap-1">
                    Sort: {sortOptions.find(o => o.value === params.sort)?.label || params.sort}
                    <button onClick={() => handleFilterUpdate({ sort: null })} className="p-0.5 rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
              </div>
            )}

            {/* Mobile Filter Drawer Overlay */}
            {isFilterOpen && (
              <div 
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-sm h-[100dvh] w-screen animate-in fade-in duration-200"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="w-[300px] h-full min-h-[100dvh] bg-[#1c1c1c] p-6 overflow-y-auto space-y-6 flex flex-col justify-between border-l border-white/5 animate-in slide-in-from-right duration-300"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h3 className="flex items-center gap-2 text-base font-bold">
                        <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                        All Filters
                      </h3>
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-5">
                      {/* Urutkan */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Sort By</span>
                        <div className="relative">
                          <select
                            value={params.sort || "POPULARITY_DESC"}
                            onChange={(e) => handleFilterUpdate({ sort: e.target.value })}
                            className="w-full h-10 appearance-none rounded-xl border border-white/5 bg-white/[0.03] px-3.5 pr-10 text-xs text-white/80 outline-none"
                          >
                            {sortOptions.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#1c1c1c] text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Release Status</span>
                        <div className="flex flex-wrap gap-1.5">
                          {statuses.map((status) => {
                            const isActive = params.status === status.value;
                            return (
                              <button
                                key={status.value}
                                onClick={() => handleFilterUpdate({ status: isActive ? null : status.value })}
                                className={`rounded-lg px-2.5 py-1 text-xs transition-all ${isActive
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "bg-white/[0.03] border border-white/5 text-white/60"
                                  }`}
                              >
                                {status.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Format */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Format</span>
                        <div className="flex flex-wrap gap-1.5">
                          {formats.map((fmt) => {
                            const isActive = params.format === fmt;
                            return (
                              <button
                                key={fmt}
                                onClick={() => handleFilterUpdate({ format: isActive ? null : fmt })}
                                className={`rounded-lg px-3 py-1 text-xs transition-all ${isActive
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "bg-white/[0.03] border border-white/5 text-white/60"
                                  }`}
                              >
                                {fmt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Season & Year */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Season</span>
                          <div className="relative">
                            <select
                              value={params.season || ""}
                              onChange={(e) => handleFilterUpdate({ season: e.target.value || null })}
                              className="w-full h-9 appearance-none rounded-xl border border-white/5 bg-white/[0.03] px-3 pr-8 text-xs text-white/80 outline-none"
                            >
                              <option value="">All</option>
                              {seasons.map((s) => (
                                <option key={s.value} value={s.value} className="bg-[#1c1c1c] text-white">
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Year</span>
                          <div className="relative">
                            <select
                              value={params.year || ""}
                              onChange={(e) => handleFilterUpdate({ year: e.target.value || null })}
                              className="w-full h-9 appearance-none rounded-xl border border-white/5 bg-white/[0.03] px-3 pr-8 text-xs text-white/80 outline-none"
                            >
                              <option value="">All</option>
                              {years.map((y) => (
                                <option key={y} value={y} className="bg-[#1c1c1c] text-white">
                                  {y}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Genre */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Genre</span>
                        <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                          {genres.map((genre) => {
                            const isActive = params.genre === genre;
                            return (
                              <button
                                key={genre}
                                onClick={() => handleFilterUpdate({ genre: isActive ? null : genre })}
                                className={`rounded-lg px-2.5 py-1 text-xs border transition-all ${isActive
                                    ? "bg-primary border-transparent text-primary-foreground font-semibold"
                                    : "bg-white/[0.02] border-white/5 text-white/50"
                                  }`}
                              >
                                {genre}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex gap-2">
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          clearAllFilters();
                          setIsFilterOpen(false);
                        }}
                        className="flex-1 h-10 rounded-xl bg-white/5 text-xs font-bold text-white/70 hover:bg-white/10 active:scale-95 transition-all"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground active:scale-95 transition-all"
                    >
                      Apply ({activeFilterCount})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading/Error/Listing Content State */}
            {isLoading ? (
              <div className="animate-pulse space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="aspect-[3/4] w-full rounded-[1.5rem] bg-white/[0.03]" />
                      <div className="h-4 w-3/4 rounded bg-white/[0.03]" />
                      <div className="h-3 w-1/2 rounded bg-white/[0.03]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <AnimeError message={error} />
            ) : anime.length > 0 ? (
              <div className="space-y-8">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {anime.map((item) => (
                      <AnimeCard key={item.id} anime={item} className="w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {anime.map((item) => (
                      <AnimeListItem key={item.id} anime={item} />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <p className="text-xs text-white/40">
                    Page {params.page} of {pageInfo?.lastPage || "Many"}
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
                      className="rounded-xl border-white/5 bg-white/[0.02] text-xs text-white/70 hover:bg-white/10 hover:text-white"
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
                      className="rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
                      disabled={!pageInfo?.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center animate-in fade-in duration-300">
                <div className="rounded-full bg-white/[0.03] p-4 text-white/40 mb-4">
                  <SlidersHorizontal className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold">No anime found</h2>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/40">
                  Try clearing some active filters or using a different search query.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-5 rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-white/15 active:scale-95 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
