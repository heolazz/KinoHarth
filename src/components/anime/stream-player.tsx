"use client";

import { useState } from "react";

import {
  Captions,
  Check,
  ChevronsUpDown,
  Mic,
  Play,
  Server,
  Subtitles,
  Zap,
} from "lucide-react";

import { HlsPlayer } from "@/components/anime/hls-player";
import type { StreamOption, StreamSource } from "@/lib/stream-providers";

type StreamPlayerProps = {
  source: StreamSource;
  title: string;
  fallbackPoster: string | null;
  basePath: string;
};

function buildCurrentOption(source: StreamSource): StreamOption | null {
  if (!source.url || source.type === "dummy") {
    return null;
  }

  return {
    url: source.url,
    type: source.type,
    server: "Default",
  };
}

function dedupeStreams(streams: StreamOption[]) {
  const seenUrls = new Set<string>();

  return streams.filter((stream) => {
    if (seenUrls.has(stream.url)) {
      return false;
    }

    seenUrls.add(stream.url);
    return true;
  });
}

function buildProviderHref(basePath: string, provider: string, category: string) {
  const params = new URLSearchParams();

  params.set("episodeProvider", provider);
  params.set("episodeCategory", category);

  return `${basePath}?${params.toString()}`;
}

function buildCategoryHref(
  basePath: string,
  source: StreamSource,
  category: string
) {
  const provider =
    source.providerOptions?.find(
      (option) =>
        option.category === category &&
        option.provider === source.selectedEpisodeProvider
    ) ||
    source.providerOptions?.find((option) => option.category === category);

  return buildProviderHref(basePath, provider?.provider || "", category);
}

function buildStreamHref(basePath: string, source: StreamSource, server: string) {
  const params = new URLSearchParams();

  if (source.selectedEpisodeProvider) {
    params.set("episodeProvider", source.selectedEpisodeProvider);
  }

  if (source.selectedEpisodeCategory) {
    params.set("episodeCategory", source.selectedEpisodeCategory);
  }

  params.set("server", server);

  return `${basePath}?${params.toString()}`;
}

function categoryLabel(category: string | undefined) {
  if (category === "dub") {
    return "Dub";
  }

  if (category === "raw") {
    return "Raw";
  }

  return "Sub";
}

function categoryIcon(category: string | undefined) {
  return category === "dub" ? (
    <Mic className="h-4 w-4" />
  ) : (
    <Captions className="h-4 w-4" />
  );
}

function tagClassName(tag: string) {
  if (tag === "EMBED") {
    return "border-white/15 bg-white/5 text-white/45";
  }

  if (tag === "S-SUB") {
    return "border-sky-300/25 bg-sky-300/10 text-sky-200";
  }

  return "border-orange-300/25 bg-orange-300/10 text-orange-200";
}

export function getProviderDisplayName(provider: string) {
  const p = provider.toLowerCase();
  if (p === "miruro") {
    return "Player";
  }
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function StreamPlayer({
  source,
  title,
  fallbackPoster,
  basePath,
}: StreamPlayerProps) {
  const [openDropdown, setOpenDropdown] = useState<"category" | "provider" | null>(null);
  const current = buildCurrentOption(source);
  const streams = dedupeStreams([
    ...(source.streams || []),
    ...(current ? [current] : []),
  ]);
  const selectedStream =
    streams.find((stream) => stream.url === source.url) || streams[0] || null;
  const providerOptions = source.providerOptions || [];
  const activeCategory =
    source.selectedEpisodeCategory || providerOptions[0]?.category || "sub";
  const activeProvider =
    providerOptions.find(
      (option) =>
        option.provider === source.selectedEpisodeProvider &&
        option.category === activeCategory
    ) || providerOptions.find((option) => option.category === activeCategory);
  const categories = Array.from(
    new Set(providerOptions.map((option) => option.category))
  ).sort((a, b) => {
    const rank = ["sub", "dub", "raw"];
    const rankA = rank.indexOf(a);
    const rankB = rank.indexOf(b);

    return (rankA === -1 ? rank.length : rankA) - (rankB === -1 ? rank.length : rankB);
  });
  const providersForCategory = providerOptions.filter(
    (option) => option.category === activeCategory
  );

  const selectedSource: StreamSource | null = selectedStream
    ? {
        ...source,
        type: selectedStream.type,
        url: selectedStream.url,
        headers: selectedStream.referer
          ? {
              ...(source.headers || {}),
              Referer: selectedStream.referer,
            }
          : source.headers,
      }
    : null;

  return (
    <div className="space-y-3">
      <div
        data-stream-player-frame
        className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
      >
        {!selectedStream || !selectedSource ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35 blur-sm"
              style={{
                backgroundImage: `url("${fallbackPoster || source.poster || ""}")`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
              <button
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.22)] transition-transform hover:scale-105"
                type="button"
                aria-label="Play dummy episode"
              >
                <Play className="ml-1 h-9 w-9 fill-current" />
              </button>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                  Episode
                </p>
                <h1 className="text-2xl font-bold md:text-4xl">{title}</h1>
                <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
                  {source.notice ||
                    "Streaming source will be connected later. For now this page locks the watch experience, episode navigation, and layout."}
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="h-1.5 w-24 rounded-full bg-white/80" />
                  <span>00:00</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span>Auto</span>
                  <span>HD</span>
                </div>
              </div>
            </div>
          </>
        ) : selectedStream.type === "embed" ? (
          <iframe
            key={selectedStream.url}
            src={selectedStream.url}
            title={title}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            allowFullScreen
          />
        ) : (
          <HlsPlayer source={selectedSource} title={title} />
        )}
      </div>

      {openDropdown !== null && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {providerOptions.length > 0 && activeProvider && (
        <div className="relative z-50 flex flex-wrap items-center gap-2">
          <div className="relative flex h-11 items-center overflow-visible rounded-xl border border-white/5 bg-[#181818]/90 text-white shadow-md backdrop-blur-md">
            {/* Category Dropdown */}
            <div className="group h-full">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
                className="flex h-full min-w-24 cursor-pointer items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-white/80 outline-none"
              >
                <span>{categoryLabel(activeCategory)}</span>
                <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-white/40" />
              </button>

              {openDropdown === "category" && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] p-1 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-1 duration-150">
                  {categories.map((category) => {
                    const isActive = category === activeCategory;

                    return (
                      <a
                        key={category}
                        href={buildCategoryHref(basePath, source, category)}
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{categoryLabel(category)}</span>
                        {isActive && <Check className="ml-auto h-3.5 w-3.5 text-white/90" />}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Provider Dropdown */}
            <div className="group h-full">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "provider" ? null : "provider")}
                className="flex h-full min-w-32 cursor-pointer items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-white/80 outline-none"
              >
                <span>{getProviderDisplayName(activeProvider.provider)}</span>
                <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-white/40" />
              </button>

              {openDropdown === "provider" && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] p-1 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-1 duration-150">
                  {providersForCategory.map((provider) => {
                    const isActive =
                      provider.provider === activeProvider.provider &&
                      provider.category === activeProvider.category;

                    return (
                      <a
                        key={`${provider.provider}-${provider.category}`}
                        href={buildProviderHref(
                          basePath,
                          provider.provider,
                          provider.category
                        )}
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{getProviderDisplayName(provider.provider)}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-white/90 ml-1" />}
                        <span className="ml-auto flex gap-1">
                          {provider.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none ${tagClassName(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {streams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 pb-4">
          <span className="flex items-center gap-2 px-2 text-sm font-medium text-white/70">
            <Server className="h-4 w-4" />
            Source
          </span>

          {streams.map((stream) => {
            const isActive = stream.url === selectedStream?.url;

            return (
              <a
                key={stream.url}
                href={buildStreamHref(basePath, source, stream.server)}
                className={`inline-flex h-9 items-center justify-center rounded-full border px-4 text-sm font-medium tracking-wide transition-all ${
                  isActive
                    ? "border-white bg-white text-black shadow-lg shadow-white/5 scale-[1.03]"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                {stream.server}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
