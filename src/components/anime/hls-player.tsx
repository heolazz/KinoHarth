"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

import { StreamSource } from "@/lib/stream-providers";

type HlsPlayerProps = {
  source: StreamSource;
  title: string;
  onErrorFallback?: () => void;
};

export function HlsPlayer({ source, title, onErrorFallback }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const video = videoRef.current;

    if (!video || !source.url) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.url;

      return;
    }

    if (!Hls.isSupported()) {
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });

    hls.loadSource(source.url);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        setError("The stream could not be loaded. The source may have expired.");
        if (onErrorFallback) {
          onErrorFallback();
        }
      }
    });

    return () => {
      hls.destroy();
    };
  }, [source.url]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full bg-black"
        controls
        playsInline
        autoPlay
        poster={source.poster || undefined}
        title={title}
        onError={() => {
          setError("The stream could not be loaded. The source may have expired.");
          if (onErrorFallback) {
            onErrorFallback();
          }
        }}
      >
        {source.subtitles.map((subtitle) => (
          <track
            key={`${subtitle.label}-${subtitle.src}`}
            kind="subtitles"
            label={subtitle.label}
            src={subtitle.src}
            srcLang={subtitle.language}
          />
        ))}
      </video>

      {error && (
        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-red-400/30 bg-red-950/85 px-4 py-3 text-sm text-red-50 shadow-xl">
          {error}
        </div>
      )}
    </div>
  );
}
