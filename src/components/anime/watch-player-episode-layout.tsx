"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

export function WatchPlayerEpisodeLayout({
  children,
  episodeList,
  seasonsSection,
}: {
  children: ReactNode;
  episodeList: ReactNode;
  seasonsSection?: ReactNode;
}) {
  const playerColumnRef = useRef<HTMLDivElement>(null);
  const episodeColumnRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const frame = playerColumnRef.current?.querySelector<HTMLElement>(
      "[data-stream-player-frame]"
    );

    if (!frame) {
      return;
    }

    const updatePlayerHeight = () => {
      if (episodeColumnRef.current) {
        const height = `${Math.round(frame.getBoundingClientRect().height)}px`;

        episodeColumnRef.current.style.height = height;
        episodeColumnRef.current.style.maxHeight = height;
      }
    };

    const animationFrame = window.requestAnimationFrame(updatePlayerHeight);

    const resizeObserver = new ResizeObserver(updatePlayerHeight);
    resizeObserver.observe(frame);
    window.addEventListener("resize", updatePlayerHeight);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePlayerHeight);
    };
  }, [children]);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <div ref={playerColumnRef}>{children}</div>

      <div className="hidden xl:flex xl:flex-col gap-6 w-[360px] flex-shrink-0">
        <aside
          ref={episodeColumnRef}
          className="min-h-0 overflow-hidden xl:h-[clamp(360px,calc(min(56.25vw,787.5px)-220px),620px)] xl:max-h-[clamp(360px,calc(min(56.25vw,787.5px)-220px),620px)]"
        >
          {episodeList}
        </aside>
        {seasonsSection && (
          <div className="space-y-6">
            {seasonsSection}
          </div>
        )}
      </div>
    </div>
  );
}
