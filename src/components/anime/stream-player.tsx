"use client";

import { Play, Server, Subtitles } from "lucide-react";

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

export function StreamPlayer({
  source,
  title,
  fallbackPoster,
  basePath,
}: StreamPlayerProps) {
  const current = buildCurrentOption(source);
  const streams = dedupeStreams([
    ...(source.streams || []),
    ...(current ? [current] : []),
  ]);
  const selectedStream =
    streams.find((stream) => stream.url === source.url) || streams[0] || null;

  if (!selectedStream) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
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
              <Subtitles className="h-4 w-4" />
              <span>Auto</span>
              <span>HD</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedSource: StreamSource = {
    ...source,
    type: selectedStream.type,
    url: selectedStream.url,
    headers: selectedStream.referer
      ? {
          ...(source.headers || {}),
          Referer: selectedStream.referer,
        }
      : source.headers,
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
        {selectedStream.type === "embed" ? (
          <iframe
            key={selectedStream.url}
            src={selectedStream.url}
            title={title}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="origin"
            allowFullScreen
          />
        ) : (
          <HlsPlayer source={selectedSource} title={title} />
        )}
      </div>

      {streams.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <span className="flex items-center gap-2 px-2 text-sm font-medium text-white/70">
            <Server className="h-4 w-4" />
            Server
          </span>

          {streams.map((stream) => {
            const isActive = stream.url === selectedStream.url;

            return (
              <a
                key={stream.url}
                href={`${basePath}?server=${encodeURIComponent(stream.server)}`}
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
