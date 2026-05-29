"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ListVideo, Play, Radio, Star, Tv } from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { EpisodeBrowser } from "@/components/anime/episode-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildWatchPath } from "@/lib/watch-path";
import type { Anime, AnimeStreamingEpisode } from "@/services/anilist";
import type { AnimeMetadataResponse } from "@/services/anime-metadata";
import { getAnimeMetadataBrowser } from "@/services/anime-metadata";
import { getAnimeDetailBrowser } from "@/services/anilist-browser";

type CharacterEdge = {
  role: string;
  node: {
    id: number;
    name: {
      full: string;
    };
    image: {
      large: string;
    };
  };
  voiceActors?: {
    id: number;
    name: {
      full: string;
    };
    image: {
      large: string;
    };
  }[];
};

type RecommendationEdge = {
  node: {
    mediaRecommendation?: Anime | null;
  };
};

type RelationEdge = {
  relationType: string;
  node: Anime;
};

export type AnimeDetail = Anime & {
  trailer?: { id: string; site: string; thumbnail: string } | null;
  characters?: { edges?: CharacterEdge[] };
  recommendations?: { edges?: RecommendationEdge[] };
  relations?: { edges?: RelationEdge[] };
};

type AnimeDetailState = {
  key: number;
  anime: AnimeDetail | null;
  error: string | null;
};

type MetadataState = {
  key: number;
  metadata: AnimeMetadataResponse | null;
};

function getEpisodeNumber(episode: AnimeStreamingEpisode, fallbackNumber: number) {
  const titleMatch = episode.title.match(/\b(?:episode|ep\.?|#)\s*(\d+)\b/i);

  if (titleMatch) return Number(titleMatch[1]);

  const urlMatch = episode.url.match(/(?:episode|ep)[-/_.]?(\d+)|[?&](?:ep|episode)=(\d+)/i);
  const urlNumber = urlMatch ? Number(urlMatch[1] || urlMatch[2]) : Number.NaN;

  return Number.isInteger(urlNumber) && urlNumber > 0 ? urlNumber : fallbackNumber;
}

function getFallbackThumbnail(anime: Anime) {
  return anime.bannerImage || anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
}

function buildEpisodeItems(
  anime: Anime & { streamingEpisodes?: AnimeStreamingEpisode[] | null },
  metadata: AnimeMetadataResponse | null
) {
  const streamingByNumber = new Map<number, AnimeStreamingEpisode>();
  const metadataByNumber = new Map(
    (metadata?.episodes || []).map((episode) => [episode.number, episode])
  );

  (anime.streamingEpisodes || []).forEach((episode, index) => {
    const number = getEpisodeNumber(episode, index + 1);

    if (!streamingByNumber.has(number)) {
      streamingByNumber.set(number, episode);
    }
  });

  // If Anilist explicitly tells us the total episode count, trust it as the absolute truth.
  // This prevents bugs where fuzzy TMDB metadata matching returns 12 episodes for a 1-episode Movie.
  let knownTotal = 0;
  
  if (anime.episodes && anime.episodes > 0) {
    knownTotal = anime.episodes;
  } else {
    knownTotal = Math.max(
      anime.nextAiringEpisode?.episode ? anime.nextAiringEpisode.episode - 1 : 0,
      streamingByNumber.size > 0 ? Math.max(...streamingByNumber.keys()) : 0,
      metadataByNumber.size > 0 ? Math.max(...metadataByNumber.keys()) : 0
    );
  }
  const episodeNumbers =
    knownTotal > 0
      ? Array.from({ length: knownTotal }, (_, index) => index + 1)
      : Array.from(new Set([...streamingByNumber.keys(), ...metadataByNumber.keys()])).sort(
          (a, b) => a - b
        );
  const fallbackThumbnail = getFallbackThumbnail(anime);

  return episodeNumbers.map((number) => {
    const streamingEpisode = streamingByNumber.get(number);
    const metadataEpisode = metadataByNumber.get(number);

    return {
      number,
      title: metadataEpisode?.title || streamingEpisode?.title || `Episode ${number}`,
      thumbnail: metadataEpisode?.thumbnail || streamingEpisode?.thumbnail || fallbackThumbnail,
      site: metadataEpisode?.site || streamingEpisode?.site,
      href: buildWatchPath(anime, number),
    };
  });
}

function formatAiringDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function formatTimeUntilAiring(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatEnum(value: string | null | undefined) {
  if (!value) return null;

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getStartDateLabel(startDate: Anime["startDate"]) {
  if (!startDate?.year) return null;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (startDate.month && startDate.day) {
    return `${months[startDate.month - 1] || ""} ${startDate.day}, ${startDate.year}`;
  }

  if (startDate.month) {
    return `${months[startDate.month - 1] || ""} ${startDate.year}`;
  }

  return String(startDate.year);
}

function DetailInfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="space-y-1 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-white/40">
        {label}
      </dt>
      <dd className="text-sm font-semibold leading-snug text-white">
        {value}
      </dd>
    </div>
  );
}

function DetailInfoPanel({ anime }: { anime: Anime }) {
  const studios =
    anime.studios?.nodes
      ?.filter((studio) => studio.isAnimationStudio)
      .map((studio) => studio.name)
      .join(", ") || null;

  return (
    <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-x-6 gap-y-4 px-1 md:flex md:max-w-none md:flex-col md:space-y-4">
      <DetailInfoItem label="Status" value={formatEnum(anime.status)} />
      <DetailInfoItem
        label="Episode Duration"
        value={anime.duration ? `${anime.duration} mins` : null}
      />
      <DetailInfoItem label="Start Date" value={getStartDateLabel(anime.startDate)} />
      <DetailInfoItem label="Studios" value={studios} />
      <DetailInfoItem label="Source" value={formatEnum(anime.source)} />
    </dl>
  );
}

function getYoutubeEmbedUrl(trailer: { id: string; site: string } | null | undefined) {
  if (!trailer?.id || trailer.site.toLowerCase() !== "youtube") {
    return null;
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.id)}?${params.toString()}`;
}

export function AnimeDetailClient({
  id,
  initialAnime,
}: {
  id: number;
  initialAnime?: AnimeDetail | null;
}) {
  const [state, setState] = useState<AnimeDetailState | null>(() =>
    initialAnime
      ? {
          key: id,
          anime: initialAnime,
          error: null,
        }
      : null
  );
  const [metadataState, setMetadataState] = useState<MetadataState | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAnimeDetailBrowser(id)
      .then((data) => {
        if (cancelled) return;
        if (!data.Media) {
          throw new Error("Anime detail was not found.");
        }
        setState({
          key: id,
          anime: data.Media,
          error: null,
        });
      })
      .catch((caught) => {
        if (!cancelled) {
          setState({
            key: id,
            anime: null,
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const anime = state?.key === id ? state.anime : null;
  const error = state?.key === id ? state.error : null;

  useEffect(() => {
    let cancelled = false;

    getAnimeMetadataBrowser(id)
      .then((metadata) => {
        if (!cancelled) {
          setMetadataState({
            key: id,
            metadata,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetadataState({
            key: id,
            metadata: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const episodeMetadata =
    metadataState?.key === id ? metadataState.metadata : null;

  if (error) {
    return (
      <div className="min-h-screen px-4 pt-28">
        <AnimeError message={error} />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen px-4 pt-28">
        <AnimeLoading title="Loading anime detail" />
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const characterEdges = anime.characters?.edges || [];
  const recommendationEdges = anime.recommendations?.edges || [];
  const relationEdges = (anime.relations?.edges || []) as RelationEdge[];
  const episodeLabel = anime.episodes
    ? `${anime.episodes} total episodes`
    : anime.status === "RELEASING"
      ? "Episode count TBA"
      : "Episode info unavailable";
  const nextAiring = anime.nextAiringEpisode;
  const episodeItems = buildEpisodeItems(anime, episodeMetadata);
  const trailerUrl = getYoutubeEmbedUrl(anime.trailer);

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative h-[40vh] min-h-[300px] w-full md:h-[50vh]">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("${anime.bannerImage || anime.coverImage.extraLarge}")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      </section>

      <section className="container relative z-10 -mt-40 px-4 pb-12 sm:-mt-44 md:-mt-48">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full flex-shrink-0 md:w-64">
            <div className="relative mx-auto aspect-[2/3] w-56 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 sm:w-64 md:w-full group">
              <img
                src={anime.coverImage.extraLarge}
                alt={title}
                className="h-full w-full object-cover"
              />
              {episodeMetadata?.tmdbLogo && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 inset-x-0 flex justify-center px-4 pointer-events-none">
                    <img
                      src={episodeMetadata.tmdbLogo}
                      alt={`${title} logo`}
                      className="max-h-12 w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transform transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mx-auto mt-6 max-w-sm space-y-3 md:max-w-none">
              <Button
                render={<Link href={buildWatchPath(anime, 1)} prefetch={false} />}
                className="h-12 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-5 w-5 fill-current" />
                Watch Now
              </Button>
            </div>
            <DetailInfoPanel anime={anime} />
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                {title}
              </h1>
              {anime.title.native && (
                <p className="text-lg font-medium text-muted-foreground">
                  {anime.title.native}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium md:justify-start">
              {anime.averageScore && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{anime.averageScore / 10}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Tv className="h-4 w-4" />
                <span>{anime.format}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {anime.season} {anime.seasonYear}
                </span>
              </div>
              {anime.episodes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{anime.episodes} EPS</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className={anime.status === "RELEASING" ? "text-primary" : ""}>
                  {anime.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {anime.genres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="bg-secondary/50 hover:bg-secondary"
                >
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/70">
                  <ListVideo className="h-4 w-4" />
                  Episodes
                </div>
                <p className="text-xl font-bold text-white">{episodeLabel}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/70">
                  <Radio className="h-4 w-4" />
                  Airing
                </div>
                {nextAiring ? (
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-white">
                      Episode {nextAiring.episode}
                    </p>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatAiringDate(nextAiring.airingAt)} (
                      {formatTimeUntilAiring(nextAiring.timeUntilAiring)})
                    </p>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-white">
                    {anime.status === "FINISHED" ? "Finished airing" : "No schedule yet"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Synopsis</h3>
              <p
                className="leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: anime.description || "No description available.",
                }}
              />
            </div>

            {trailerUrl && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Trailer</h3>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                  <iframe
                    src={trailerUrl}
                    title={`${title} trailer`}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {characterEdges.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Characters</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {characterEdges.map((edge) => (
                <div key={edge.node.id} className="flex h-24 overflow-hidden rounded-xl bg-muted/20">
                  <img
                    src={edge.node.image.large}
                    alt={edge.node.name.full}
                    className="w-16 object-cover"
                    loading="lazy"
                  />
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <p className="line-clamp-1 text-sm font-semibold">
                        {edge.node.name.full}
                      </p>
                      <p className="text-xs text-muted-foreground">{edge.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {episodeItems.length > 0 && <EpisodeBrowser episodes={episodeItems} />}

        {relationEdges.filter((edge) => edge.node?.type === "ANIME").length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Related Work</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
              {relationEdges
                .filter((edge) => edge.node?.type === "ANIME")
                .slice(0, 6)
                .map((edge) => (
                  <AnimeCard key={edge.node.id} anime={edge.node} />
                ))}
            </div>
          </div>
        )}

        {recommendationEdges.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Recommended</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
              {recommendationEdges.slice(0, 6).map((edge) => {
                const recAnime = edge.node.mediaRecommendation;
                if (!recAnime) return null;
                return <AnimeCard key={recAnime.id} anime={recAnime} />;
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
