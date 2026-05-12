"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anime } from "@/services/anilist";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface HeroSliderProps {
  animes: Anime[];
}

const FORMAT_MAP: Record<string, string> = {
  TV: "TV Show",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RELEASING: { label: "Airing", color: "#00E676" },
  FINISHED: { label: "Completed", color: "#2979FF" },
  NOT_YET_RELEASED: { label: "Upcoming", color: "#FFEA00" },
  CANCELLED: { label: "Cancelled", color: "#FF1744" },
  HIATUS: { label: "Hiatus", color: "#FF9100" },
};

const MAX_HERO_SLIDES = 5;
const SLIDE_INTERVAL_MS = 6000;

export function HeroSlider({ animes }: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slides = useMemo(() => animes.slice(0, MAX_HERO_SLIDES), [animes]);
  const total = slides.length;
  const activeIndex = total > 0 ? active % total : 0;

  const clearAutoPlay = useCallback(() => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlay();
    if (total <= 1) return;

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, SLIDE_INTERVAL_MS);
  }, [clearAutoPlay, total]);

  useEffect(() => {
    startAutoPlay();

    return clearAutoPlay;
  }, [clearAutoPlay, startAutoPlay]);

  const goTo = useCallback((i: number) => {
    setActive(i);
    startAutoPlay();
  }, [startAutoPlay]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setActive((prev) => (prev + 1) % total);
    startAutoPlay();
  }, [startAutoPlay, total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setActive((prev) => (prev - 1 + total) % total);
    startAutoPlay();
  }, [startAutoPlay, total]);

  if (!slides.length) return null;

  const anime = slides[activeIndex];
  const title = anime.title.english || anime.title.romaji;
  const format = anime.format ? FORMAT_MAP[anime.format] || anime.format : "";
  const status = anime.status ? STATUS_MAP[anime.status] : null;

  return (
    <section className="relative w-full h-[90vh] overflow-hidden">
      {/* Single Background Image - Forces browser to load the new source */}
      <div className="absolute inset-0 z-0 bg-black">
        <img
          key={`bg-${anime.id}`} // Key forces React to mount a new img element on change
          src={anime.bannerImage || anime.coverImage.extraLarge}
          alt={title}
          className="w-full h-full object-cover"
          style={{
            objectPosition: "center 15%",
            animation: "fadeInZoom 1s ease-out forwards",
          }}
        />
      </div>

      {/* Cinematic Gradients using Tailwind variables to match app background seamlessly */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-background/90 via-background/30 to-transparent w-3/4" />
      
      {/* Extra deep bottom fade to completely blend into the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-[280px] z-[2] bg-gradient-to-t from-background via-background/90 to-transparent" />

      {/* Content */}
      <div
        key={`content-${anime.id}`}
        style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", alignItems: "center", paddingTop: "64px" }}
      >
        <div style={{ maxWidth: "720px", padding: "0 48px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Meta Tags */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {status && (
              <span style={{ color: status.color, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{status.label}</span>
            )}
            {format && (
              <>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{format}</span>
              </>
            )}
            {anime.seasonYear && (
              <>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{anime.seasonYear}</span>
              </>
            )}
            {anime.averageScore && (
              <>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                <span style={{ color: "#FFD700" }}>★ {(anime.averageScore / 10).toFixed(1)}</span>
              </>
            )}
          </div>

          {/* Native title */}
          {anime.title.native && (
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.25)", fontWeight: 500, letterSpacing: "0.05em", margin: 0 }}>
              {anime.title.native}
            </p>
          )}

          {/* Main Title */}
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", fontWeight: 900, color: "white", lineHeight: 0.95, letterSpacing: "-0.03em", margin: 0, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {title}
          </h1>

          {/* Description */}
          <p
            style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "90%", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            dangerouslySetInnerHTML={{ __html: anime.description || "" }}
          />

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "8px" }}>
            <Link
              href={`/watch/${anime.id}/1`}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9999px", padding: "0 32px", height: "48px", fontSize: "16px", fontWeight: 700, background: "white", color: "black", textDecoration: "none", transition: "all 0.2s" }}
            >
              <Play style={{ width: "20px", height: "20px", fill: "currentColor", marginRight: "8px" }} />
              Play
            </Link>
            <Link
              href={`/anime/${anime.id}`}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9999px", padding: "0 32px", height: "48px", fontSize: "16px", fontWeight: 700, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)", color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", transition: "all 0.2s" }}
            >
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Prev/Next Arrows */}
      <button
        onClick={goPrev}
        style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", zIndex: 40, padding: "12px", borderRadius: "50%", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer", opacity: 0, transition: "opacity 0.3s" }}
        className="hero-nav-btn"
        aria-label="Previous"
      >
        <ChevronLeft style={{ width: "24px", height: "24px" }} />
      </button>
      <button
        onClick={goNext}
        style={{ position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)", zIndex: 40, padding: "12px", borderRadius: "50%", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer", opacity: 0, transition: "opacity 0.3s" }}
        className="hero-nav-btn"
        aria-label="Next"
      >
        <ChevronRight style={{ width: "24px", height: "24px" }} />
      </button>

      {/* Dot Indicators */}
      <div style={{ position: "absolute", bottom: "48px", left: 0, right: 0, zIndex: 40, display: "flex", justifyContent: "center", gap: "8px" }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              padding: "12px 4px", // Huge clickable area
              cursor: "pointer",
              background: "transparent",
              border: "none",
              outline: "none",
            }}
            aria-label={`Slide ${i + 1}`}
          >
            <div
              style={{
                width: i === activeIndex ? "40px" : "10px",
                height: "6px",
                borderRadius: "3px",
                background: i === activeIndex ? "white" : "rgba(255,255,255,0.3)",
                transition: "all 0.4s ease",
                boxShadow: i === activeIndex ? "0 0 8px rgba(255,255,255,0.4)" : "none",
              }}
            />
          </button>
        ))}
      </div>



      {/* Hover style for nav buttons */}
      <style jsx>{`
        section:hover .hero-nav-btn {
          opacity: 1 !important;
        }
        .hero-nav-btn:hover {
          background: rgba(0,0,0,0.5) !important;
          color: white !important;
        }
      `}</style>
    </section>
  );
}
