"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Server,
} from "lucide-react";

import { AnimeError, AnimeLoading } from "@/components/anime/anime-loading";
import { HistorySaver } from "@/components/anime/history-saver";
import { StreamPlayer } from "@/components/anime/stream-player";
import { WatchEpisodeList } from "@/components/anime/watch-episode-list";
import { WatchPlayerEpisodeLayout } from "@/components/anime/watch-player-episode-layout";
import { WatchSynopsis } from "@/components/anime/watch-synopsis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StreamSource } from "@/lib/stream-providers";
import { buildWatchPath } from "@/lib/watch-path";
import type { Anime, AnimeStreamingEpisode } from "@/services/anilist";
import type { AnimeMetadataResponse } from "@/services/anime-metadata";
import { getAnimeMetadataBrowser } from "@/services/anime-metadata";
import { getAnimeDetailBrowser } from "@/services/anilist-browser";
import WatchLoading from "./loading";

const DEFAULT_EPISODE_COUNT = 12;
const EPISODE_GROUP_SIZE = 100;

type RelationEdge = {
  relationType: string;
  node?: Anime | null;
};

type WatchAnime = Anime & {
  streamingEpisodes?: AnimeStreamingEpisode[] | null;
  relations?: {
    edges?: RelationEdge[];
  };
};

type WatchState = {
  key: number;
  anime: WatchAnime | null;
  error: string | null;
};

type StreamLoadState = {
  key: string;
  source: StreamSource;
};

type MetadataState = {
  key: number;
  metadata: AnimeMetadataResponse | null;
};

function formatEnum(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getDisplayTitle(anime: Anime) {
  return anime.title.english || anime.title.romaji || anime.title.native;
}

function getFallbackThumbnail(anime: Anime) {
  return anime.bannerImage || anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
}

function getAniListEpisodeNumber(episode: AnimeStreamingEpisode, fallbackNumber: number) {
  const titleMatch = episode.title.match(/\b(?:episode|ep\.?|#)\s*(\d+)\b/i);

  if (titleMatch) return Number(titleMatch[1]);

  const urlMatch = episode.url.match(/(?:episode|ep)[-/_.]?(\d+)|[?&](?:ep|episode)=(\d+)/i);
  const urlNumber = urlMatch ? Number(urlMatch[1] || urlMatch[2]) : Number.NaN;

  return Number.isInteger(urlNumber) && urlNumber > 0 ? urlNumber : fallbackNumber;
}

function buildEpisodeNumbers(
  anime: WatchAnime,
  currentEpisode: number,
  metadata: AnimeMetadataResponse | null
) {
  const streamingNumbers =
    anime.streamingEpisodes?.map((episode, index) =>
      getAniListEpisodeNumber(episode, index + 1)
    ) || [];
  const maxStreamingEpisode =
    streamingNumbers.length > 0 ? Math.max(...streamingNumbers) : 0;
  const metadataNumbers = metadata?.episodes.map((episode) => episode.number) || [];
  const maxMetadataEpisode =
    metadataNumbers.length > 0 ? Math.max(...metadataNumbers) : 0;

  // Use the real episode count from AniList when available.
  // Only fall back to DEFAULT_EPISODE_COUNT when NO source provides a count.
  const knownMax = Math.max(
    anime.episodes || 0,
    maxStreamingEpisode,
    maxMetadataEpisode,
    currentEpisode
  );
  const totalEpisodes = knownMax > 0 ? knownMax : DEFAULT_EPISODE_COUNT;

  return Array.from({ length: totalEpisodes }, (_, index) => index + 1);
}

function buildEpisodeGroups(episodeNumbers: number[]) {
  const maxEpisode = episodeNumbers.length > 0 ? Math.max(...episodeNumbers) : DEFAULT_EPISODE_COUNT;
  const groups = [];

  for (let start = 1; start <= maxEpisode; start += EPISODE_GROUP_SIZE) {
    groups.push({
      start,
      end: Math.min(start + EPISODE_GROUP_SIZE - 1, maxEpisode),
    });
  }

  return groups;
}

function getActiveEpisodeGroup(episodeNumbers: number[], currentEpisode: number) {
  return (
    buildEpisodeGroups(episodeNumbers).find(
      (group) => currentEpisode >= group.start && currentEpisode <= group.end
    ) || { start: 1, end: Math.max(DEFAULT_EPISODE_COUNT, currentEpisode) }
  );
}

function buildEpisodeItems(
  anime: WatchAnime,
  metadata: AnimeMetadataResponse | null,
  episodeNumbers: number[],
  currentGroup: { start: number; end: number }
) {
  const fallbackThumbnail = getFallbackThumbnail(anime);
  const streamingByNumber = new Map<number, AnimeStreamingEpisode>();
  const metadataByNumber = new Map(
    (metadata?.episodes || []).map((episode) => [episode.number, episode])
  );

  (anime.streamingEpisodes || []).forEach((episode, index) => {
    const number = getAniListEpisodeNumber(episode, index + 1);

    if (!streamingByNumber.has(number)) {
      streamingByNumber.set(number, episode);
    }
  });

  return episodeNumbers
    .filter((number) => number >= currentGroup.start && number <= currentGroup.end)
    .map((number) => {
      const streamingEpisode = streamingByNumber.get(number);
      const metadataEpisode = metadataByNumber.get(number);

      const nextAiring = anime.nextAiringEpisode;
      const isUnreleased = nextAiring ? number >= nextAiring.episode : false;
      const airingAt = nextAiring && number === nextAiring.episode ? nextAiring.airingAt : null;

      return {
        number,
        title: metadataEpisode?.title || streamingEpisode?.title || `Episode ${number}`,
        thumbnail: metadataEpisode?.thumbnail || streamingEpisode?.thumbnail || fallbackThumbnail,
        href: buildWatchPath(anime, number),
        unreleased: isUnreleased,
        airingAt: airingAt,
      };
    });
}

function buildFallbackSource(anime: Anime, episode: number): StreamSource {
  return {
    provider: "dummy",
    type: "dummy",
    animeId: anime.id,
    episode,
    title: getDisplayTitle(anime),
    url: null,
    poster: getFallbackThumbnail(anime),
    subtitles: [],
    availableEpisodes: [],
    notice:
      "AniList data is loaded directly from your browser on Cloudflare. The streaming source is kept server-free here to avoid AniList blocking Cloudflare Worker requests.",
  };
}

export function WatchClient({
  animeId,
  episode,
  initialAnime,
  initialMetadata = null,
}: {
  animeId: number;
  episode: number;
  initialAnime?: WatchAnime | null;
  initialMetadata?: AnimeMetadataResponse | null;
}) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<WatchState | null>(() =>
    initialAnime ? { key: animeId, anime: initialAnime, error: null } : null
  );
  const [streamState, setStreamState] = useState<StreamLoadState | null>(null);
  const [metadataState, setMetadataState] = useState<MetadataState | null>(() =>
    initialMetadata ? { key: animeId, metadata: initialMetadata } : null
  );

  useEffect(() => {
    let cancelled = false;

    if (!initialAnime) {
      getAnimeDetailBrowser(animeId)
        .then((data) => {
          if (cancelled) return;
          if (!data.Media) throw new Error("Anime detail was not found.");
          setState({
            key: animeId,
            anime: data.Media as WatchAnime,
            error: null,
          });
        })
        .catch((caught) => {
          if (!cancelled) {
            setState({
              key: animeId,
              anime: null,
              error: caught instanceof Error ? caught.message : String(caught),
            });
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [animeId]);

  const anime = state?.key === animeId ? state.anime : null;
  const error = state?.key === animeId ? state.error : null;
  const episodeMetadata =
    metadataState?.key === animeId ? metadataState.metadata : null;

  useEffect(() => {
    let cancelled = false;

    // Only fetch metadata if it wasn't provided via SSR
    if (!initialMetadata) {
      getAnimeMetadataBrowser(animeId)
        .then((metadata) => {
          if (!cancelled) {
            setMetadataState({
              key: animeId,
              metadata,
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMetadataState({
              key: animeId,
              metadata: null,
            });
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [animeId]);

  const model = useMemo(() => {
    if (!anime) return null;

    const title = getDisplayTitle(anime);
    const safeEpisode = Math.max(episode, 1);
    const episodeNumbers = buildEpisodeNumbers(anime, safeEpisode, episodeMetadata);
    const activeEpisodeGroup = getActiveEpisodeGroup(episodeNumbers, safeEpisode);
    const episodeGroups = buildEpisodeGroups(episodeNumbers);
    const episodes = buildEpisodeItems(
      anime,
      episodeMetadata,
      episodeNumbers,
      activeEpisodeGroup
    );
    const currentEpisodeIndex = episodeNumbers.indexOf(safeEpisode);
    const previousEpisode =
      currentEpisodeIndex > 0 ? episodeNumbers[currentEpisodeIndex - 1] : null;
    const nextEpisode =
      currentEpisodeIndex >= 0 && currentEpisodeIndex < episodeNumbers.length - 1
        ? episodeNumbers[currentEpisodeIndex + 1]
        : null;
    const source = buildFallbackSource(anime, safeEpisode);
    const episodeListGroups = episodeGroups.map((group) => ({
      ...group,
      href: buildWatchPath(anime, group.start),
      isActive:
        group.start === activeEpisodeGroup.start &&
        group.end === activeEpisodeGroup.end,
    }));

    const currentEpisodeItem = episodes.find((e) => e.number === safeEpisode);
    const poster = currentEpisodeItem?.thumbnail || getFallbackThumbnail(anime);

    return {
      title,
      safeEpisode,
      source,
      episodes,
      episodeListGroups,
      totalEpisodes: Math.max(...episodeNumbers),
      previousEpisode,
      nextEpisode,
      poster,
    };
  }, [anime, episode, episodeMetadata]);
  const queryKey = searchParams.toString();
  const streamKey =
    anime && model
      ? `${anime.id}:${model.safeEpisode}:${model.title}:${model.poster}:${queryKey}`
      : "";

  useEffect(() => {
    let cancelled = false;

    if (!anime || !model) {
      return;
    }

    const params = new URLSearchParams(queryKey);
    params.set("title", model.title);
    if (model.poster) params.set("poster", model.poster);

    fetch(`/api/stream/${anime.id}/${model.safeEpisode}?${params.toString()}`, {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Stream API responded with ${response.status}`);
        }

        return response.json() as Promise<StreamSource>;
      })
      .then((source) => {
        if (!cancelled) {
          setStreamState({
            key: streamKey,
            source,
          });
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setStreamState({
            key: streamKey,
            source: {
              ...buildFallbackSource(anime, model.safeEpisode),
              notice:
                caught instanceof Error
                  ? `Stream provider failed: ${caught.message}`
                  : "Stream provider failed.",
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [anime, model, queryKey, streamKey]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] px-4 pt-28 text-white">
        <AnimeError message={error} />
      </div>
    );
  }

  if (!anime || !model) {
    return <WatchLoading />;
  }

  const streamSource =
    streamState?.key === streamKey ? streamState.source : model.source;

  const renderEpisodesList = (className?: string) => (
    <WatchEpisodeList
      className={className}
      episodes={model.episodes}
      groups={model.episodeListGroups}
      currentEpisode={model.safeEpisode}
      totalEpisodes={model.totalEpisodes}
    />
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#111111] pt-24 text-white">
      <HistorySaver
        animeId={anime.id}
        title={model.title}
        poster={model.poster}
        episodeNumber={model.safeEpisode}
      />
      <section className="container mx-auto w-full px-4 pb-12 md:px-8 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/anime/${anime.id}`}
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Link>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <Server className="h-4 w-4" />
            {streamSource.provider === "dummy" ? "Browser AniList mode" : `${streamSource.provider} player`}
          </div>
        </div>

        <WatchPlayerEpisodeLayout episodeList={renderEpisodesList("h-full")}>
          <StreamPlayer
            key={`${anime.id}-${model.safeEpisode}`}
            source={streamSource}
            title={`${model.title} episode ${model.safeEpisode}`}
            fallbackPoster={model.poster}
            basePath={buildWatchPath(anime, model.safeEpisode)}
          />

          <div className="flex flex-col gap-4 pb-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {anime.format}
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {anime.status}
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {streamSource.provider === "dummy" ? "client-side data" : streamSource.provider}
                </Badge>
                <span className="text-sm text-white/55">
                  {model.totalEpisodes} episodes
                </span>
              </div>
              <h2 className="text-xl font-semibold">
                Episode {model.safeEpisode}: {model.title}
              </h2>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Button
                render={
                  model.previousEpisode ? (
                    <Link href={buildWatchPath(anime, model.previousEpisode)} prefetch={false} />
                  ) : undefined
                }
                variant="outline"
                className="h-10 flex-1 justify-center gap-2 rounded-full border-white/10 bg-white/5 px-5 text-white hover:bg-white/10 sm:flex-none"
                disabled={!model.previousEpisode}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                render={
                  model.nextEpisode ? (
                    <Link href={buildWatchPath(anime, model.nextEpisode)} prefetch={false} />
                  ) : undefined
                }
                className="h-10 flex-1 justify-center gap-2 rounded-full bg-white px-5 text-black hover:bg-white/90 sm:flex-none"
                disabled={!model.nextEpisode}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {renderEpisodesList("my-6 h-[400px] sm:h-[480px] xl:hidden")}

          <div className="mt-6 flex flex-col gap-6 border-t border-white/5 pt-8 md:mt-6 md:flex-row md:pt-12">
            <div className="mx-auto w-44 flex-shrink-0 md:mx-0 md:w-52">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
                <img
                  src={anime.coverImage.extraLarge || anime.coverImage.large}
                  alt={model.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="flex-1 space-y-5">
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                  {model.title}
                </h1>
                {anime.title.native && (
                  <p className="text-sm font-medium text-white/45">
                    {anime.title.native}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-white/60 md:justify-start">
                {anime.averageScore && (
                  <>
                    <span className="text-yellow-500">Star {anime.averageScore / 10}</span>
                    <span>|</span>
                  </>
                )}
                <span>{formatEnum(anime.format)}</span>
                <span>|</span>
                <span>{anime.season} {anime.seasonYear}</span>
                <span>|</span>
                <span className={anime.status === "RELEASING" ? "text-amber-500" : ""}>
                  {formatEnum(anime.status)}
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {anime.genres.slice(0, 5).map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="rounded-full border border-white/5 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 hover:bg-white/15"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>

              <WatchSynopsis description={anime.description || "No description available."} />
            </div>
          </div>
        </WatchPlayerEpisodeLayout>
      </section>
    </div>
  );
}
