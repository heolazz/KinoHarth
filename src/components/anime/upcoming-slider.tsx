"use client";

import Link from "next/link";
import { Anime } from "@/services/anilist";

interface UpcomingSliderProps {
  animes: Anime[];
}

export function UpcomingSlider({ animes }: UpcomingSliderProps) {
  if (!animes?.length) return null;

  // Card dimensions — explicit pixel values for bulletproof Safari rendering
  const CARD_W_MOBILE = 300;
  const CARD_W_DESKTOP = 480;
  const CARD_H_MOBILE = 170;
  const CARD_H_DESKTOP = 270;
  const GAP = 16;

  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "-0.02em",
          marginBottom: "20px",
        }}
      >
        Coming Soon
      </h2>

      {/* 
        Safari iPad bulletproof approach:
        - Outer div: overflow-x scroll
        - Inner div: explicit calculated width so Safari knows the scroll area
        - Each card: inline-block with explicit pixel dimensions
        - No flex, no grid, no aspect-ratio
      */}
      <div
        className="hide-scrollbar"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "24px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: `${GAP}px`,
          }}
        >
          {animes.map((anime) => {
            const title =
              anime.title.english || anime.title.romaji || anime.title.native;
            const image =
              anime.bannerImage || anime.coverImage.extraLarge;

            let releaseInfo = "TBA";
            if (anime.season && anime.seasonYear) {
              releaseInfo = `${anime.season.charAt(0) + anime.season.slice(1).toLowerCase()} ${anime.seasonYear}`;
            }

            const studio =
              anime.studios?.nodes?.find((n) => n.isAnimationStudio)?.name ||
              anime.studios?.nodes?.[0]?.name;

            return (
              <Link
                href={`/anime/${anime.id}`}
                key={anime.id}
                style={{
                  display: "block",
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  textDecoration: "none",
                  flexShrink: 0,
                  // Responsive: JS can't help here, so we use the mobile size
                  // and let the CSS media query in <style> override for desktop
                  width: `${CARD_W_MOBILE}px`,
                  height: `${CARD_H_MOBILE}px`,
                }}
                className="upcoming-card"
              >
                {/* Background image — plain <img> for max Safari compat */}
                <img
                  src={image}
                  alt={title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: anime.bannerImage
                      ? "center center"
                      : "center 25%",
                    transition: "transform 0.8s ease",
                  }}
                  className="upcoming-card-img"
                  loading="lazy"
                />

                {/* Cinematic gradient overlays */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.5) 50%, transparent 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to right, rgba(9,9,11,0.6) 0%, transparent 60%)",
                  }}
                />

                {/* Content */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        textTransform: "uppercase",
                      }}
                    >
                      {releaseInfo}
                    </span>
                    {studio && (
                      <>
                        <span
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.3)",
                            display: "inline-block",
                          }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>
                          {studio}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "white",
                      margin: 0,
                      lineHeight: 1.25,
                      textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      transition: "color 0.3s ease",
                    }}
                    className="upcoming-card-title"
                  >
                    {title}
                  </h3>

                  {/* Genres */}
                  {anime.genres && anime.genres.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {anime.genres.slice(0, 3).map((genre, i) => (
                        <span
                          key={genre}
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.4)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {i > 0 && (
                            <span style={{ margin: "0 4px", color: "rgba(255,255,255,0.15)" }}>
                              ·
                            </span>
                          )}
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Responsive sizing + hover effects via CSS */}
      <style jsx>{`
        @media (min-width: 768px) {
          .upcoming-card {
            width: ${CARD_W_DESKTOP}px !important;
            height: ${CARD_H_DESKTOP}px !important;
          }
          .upcoming-card-title {
            font-size: 22px !important;
          }
        }
        .upcoming-card:hover .upcoming-card-img {
          transform: scale(1.08);
        }
        .upcoming-card:hover .upcoming-card-title {
          color: rgba(255, 255, 255, 0.85) !important;
        }
      `}</style>
    </div>
  );
}
