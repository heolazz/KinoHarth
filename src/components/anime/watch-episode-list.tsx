"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export type WatchEpisodeListItem = {
  number: number;
  title: string;
  thumbnail: string;
  href: string;
};

type EpisodeGroup = {
  start: number;
  end: number;
  href: string;
  isActive: boolean;
};

function filterEpisodes(episodes: WatchEpisodeListItem[], searchTerm: string) {
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

export function WatchEpisodeList({
  className,
  episodes,
  groups,
  currentEpisode,
  totalEpisodes,
}: {
  className?: string;
  episodes: WatchEpisodeListItem[];
  groups: EpisodeGroup[];
  currentEpisode: number;
  totalEpisodes: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredEpisodes = useMemo(
    () => filterEpisodes(episodes, searchTerm),
    [episodes, searchTerm]
  );

  return (
    <div
      className={`flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className || ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Episodes</h2>
        <span className="text-sm text-white/50">{totalEpisodes} total</span>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
        <Search className="h-4 w-4 shrink-0 text-white/40" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search episode"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
      </div>

      {groups.length > 1 && (
        <div className="mb-4 flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((group) => (
            <Link
              key={`${group.start}-${group.end}`}
              href={group.href}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                group.isActive
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {group.start}-{group.end}
            </Link>
          ))}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1">
        {filteredEpisodes.length > 0 ? (
          filteredEpisodes.map((item) => {
            const isActive = item.number === currentEpisode;

            return (
              <Link
                key={item.number}
                href={item.href}
                className={`group grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-xl border p-2 transition-colors ${
                  isActive
                    ? "border-white/30 bg-white text-black"
                    : "border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
                }`}
              >
                <span className="relative aspect-video overflow-hidden rounded-lg bg-black/30">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span
                    className={`absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-black text-white" : "bg-black/75 text-white"
                    }`}
                  >
                    EP {item.number}
                  </span>
                </span>
                <span className="min-w-0 py-1">
                  <span className="block truncate text-sm font-semibold">
                    Episode {item.number}
                  </span>
                  <span
                    className={`block truncate text-xs leading-5 ${
                      isActive ? "text-black/60" : "text-white/45"
                    }`}
                  >
                    {item.title}
                  </span>
                </span>
              </Link>
            );
          })
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
            No episodes match your search.
          </div>
        )}
      </div>
    </div>
  );
}
