import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Server,
} from "lucide-react";

import { StreamPlayer } from "@/components/anime/stream-player";
import { WatchSynopsis } from "@/components/anime/watch-synopsis";
import { WatchEpisodeList } from "@/components/anime/watch-episode-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStreamSource } from "@/lib/stream-providers";
import { buildWatchPath, parseEpisodeSegment } from "@/lib/watch-path";
import { Anime, AnimeStreamingEpisode, getAnimeDetail } from "@/services/anilist";
import {
  getMiruroAnimeEpisodeMetadata,
  MiruroAnimeEpisodeMetadata,
} from "@/services/miruro";
import { getBestTmdbEpisodeThumbnail } from "@/services/tmdb";

const DEFAULT_EPISODE_COUNT = 12;
const EPISODE_GROUP_SIZE = 100;

type RelationEdge = {
  relationType: string;
  node?: Anime | null;
};

type WatchEpisodeItem = {
  number: number;
  title: string;
  thumbnail: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ animeId: string; episode: string }>;
}): Promise<Metadata> {
  const { animeId, episode } = await params;
  const animeIdNumber = Number(animeId);
  const episodeNumber = parseEpisodeSegment(episode);

  if (!Number.isInteger(animeIdNumber) || !Number.isInteger(episodeNumber)) {
    return {
      title: "Watch Anime | KinoHarth",
    };
  }

  const data = await getAnimeDetail(animeIdNumber);
  const anime = data?.Media;

  if (!anime) {
    return {
      title: "Watch Anime | KinoHarth",
    };
  }

  const title = getDisplayTitle(anime);

  return {
    title: `${title} Episode ${episodeNumber} | KinoHarth`,
    description: `Watch ${title} episode ${episodeNumber} on KinoHarth.`,
  };
}

function formatEnum(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getDisplayTitle(anime: Anime) {
  return anime.title.english || anime.title.romaji || anime.title.native;
}

function getRelationLabel(relationType: string) {
  return formatEnum(relationType).replace("Prequel", "Previous").replace("Sequel", "Next");
}

function getMaxEpisode(episodes: number[]) {
  return episodes.length > 0 ? Math.max(...episodes) : 0;
}

function getMaxMiruroEpisode(metadata: MiruroAnimeEpisodeMetadata | null) {
  return getMaxEpisode(metadata?.episodes.map((episode) => episode.number) || []);
}

function buildEpisodeNumbers(totalEpisodes: number, availableEpisodes?: number[]) {
  if (availableEpisodes && availableEpisodes.length > 0) {
    return availableEpisodes;
  }

  return Array.from({ length: totalEpisodes }, (_, index) => index + 1);
}

function buildEpisodeGroups(episodeNumbers: number[]) {
  const maxEpisode = getMaxEpisode(episodeNumbers);
  const groups = [];

  for (let start = 1; start <= maxEpisode; start += EPISODE_GROUP_SIZE) {
    const end = Math.min(start + EPISODE_GROUP_SIZE - 1, maxEpisode);
    const hasEpisodes = episodeNumbers.some(
      (episodeNumber) => episodeNumber >= start && episodeNumber <= end
    );

    if (hasEpisodes) {
      groups.push({ start, end });
    }
  }

  return groups;
}

function getActiveEpisodeGroup(episodeNumbers: number[], currentEpisode: number) {
  const groups = buildEpisodeGroups(episodeNumbers);

  return (
    groups.find(
      (group) => currentEpisode >= group.start && currentEpisode <= group.end
    ) ||
    groups[0] || {
      start: 1,
      end: Math.max(DEFAULT_EPISODE_COUNT, currentEpisode),
    }
  );
}

function getAniListEpisodeNumber(
  episode: AnimeStreamingEpisode,
  fallbackNumber: number
) {
  const titleMatch = episode.title.match(/\b(?:episode|ep\.?|#)\s*(\d+)\b/i);

  if (titleMatch) {
    return Number(titleMatch[1]);
  }

  const urlMatch = episode.url.match(/(?:episode|ep)[-/_.]?(\d+)|[?&](?:ep|episode)=(\d+)/i);
  const urlNumber = urlMatch ? Number(urlMatch[1] || urlMatch[2]) : Number.NaN;

  return Number.isInteger(urlNumber) && urlNumber > 0 ? urlNumber : fallbackNumber;
}

function getFallbackThumbnail(anime: Anime) {
  return anime.bannerImage || anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
}

async function buildEpisodeItems({
  anime,
  episodeNumbers,
  miruroMetadata,
}: {
  anime: Anime & { streamingEpisodes?: AnimeStreamingEpisode[] | null };
  episodeNumbers: number[];
  miruroMetadata: MiruroAnimeEpisodeMetadata | null;
}) {
  const fallbackThumbnail = getFallbackThumbnail(anime);
  const miruroByNumber = new Map(
    (miruroMetadata?.episodes || []).map((episode) => [episode.number, episode])
  );
  const aniListByNumber = new Map<number, AnimeStreamingEpisode>();

  (anime.streamingEpisodes || []).forEach((episode, index) => {
    const number = getAniListEpisodeNumber(episode, index + 1);

    if (!aniListByNumber.has(number)) {
      aniListByNumber.set(number, episode);
    }
  });

  return Promise.all(
    episodeNumbers.map(async (episodeNumber): Promise<WatchEpisodeItem> => {
      const miruroEpisode = miruroByNumber.get(episodeNumber);
      const aniListEpisode = aniListByNumber.get(episodeNumber);
      const tmdbThumbnail =
        miruroEpisode?.image || aniListEpisode?.thumbnail || !miruroMetadata?.tmdbId || !miruroMetadata?.tmdbSeason
          ? null
          : await getBestTmdbEpisodeThumbnail({
              seriesId: miruroMetadata.tmdbId,
              seasonNumber: miruroMetadata.tmdbSeason,
              episodeNumber,
            });

      return {
        number: episodeNumber,
        title: miruroEpisode?.title || aniListEpisode?.title || `Episode ${episodeNumber}`,
        thumbnail:
          miruroEpisode?.image ||
          aniListEpisode?.thumbnail ||
          tmdbThumbnail ||
          fallbackThumbnail,
      };
    })
  );
}

function CompactAnimeLink({
  anime,
  label,
}: {
  anime: Anime;
  label?: string;
}) {
  const cardTitle = getDisplayTitle(anime);

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group grid grid-cols-[56px_minmax(0,1fr)] gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-2 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] backdrop-blur-md"
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">
        <img
          src={anime.coverImage.large || anime.coverImage.medium}
          alt={cardTitle}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <span className="min-w-0 py-1">
        {label && (
          <span className="mb-1.5 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
            {label}
          </span>
        )}
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-amber-500">
          {cardTitle}
        </span>
        <span className="mt-1.5 block text-xs text-white/45">
          {formatEnum(anime.format)} {anime.seasonYear ? `- ${anime.seasonYear}` : ""}
        </span>
      </span>
    </Link>
  );
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ animeId: string; episode: string }>;
  searchParams: Promise<{
    episodeCategory?: string | string[];
    episodeProvider?: string | string[];
    server?: string | string[];
  }>;
}) {
  const { animeId, episode } = await params;
  const { episodeCategory, episodeProvider, server } = await searchParams;
  const animeIdNumber = Number(animeId);
  const currentEpisode = parseEpisodeSegment(episode);
  const selectedEpisodeProvider = Array.isArray(episodeProvider)
    ? episodeProvider[0]
    : episodeProvider;
  const selectedEpisodeCategory = Array.isArray(episodeCategory)
    ? episodeCategory[0]
    : episodeCategory;
  const selectedServer = Array.isArray(server) ? server[0] : server;

  if (!Number.isInteger(animeIdNumber) || !Number.isInteger(currentEpisode)) {
    notFound();
  }

  const data = await getAnimeDetail(animeIdNumber);
  const anime = data?.Media;

  if (!anime) {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const miruroMetadata = await getMiruroAnimeEpisodeMetadata(animeIdNumber);
  const provisionalEpisode = Math.max(currentEpisode, 1);
  const streamSource = await getStreamSource(
    animeIdNumber,
    provisionalEpisode,
    undefined,
    selectedServer,
    selectedEpisodeProvider,
    selectedEpisodeCategory
  );
  const episodeNumbers = buildEpisodeNumbers(
    Math.max(
      anime.episodes || 0,
      getMaxEpisode(streamSource.availableEpisodes || []),
      getMaxMiruroEpisode(miruroMetadata),
      DEFAULT_EPISODE_COUNT
    ),
    streamSource.availableEpisodes
  );
  const totalEpisodes = getMaxEpisode(episodeNumbers) || DEFAULT_EPISODE_COUNT;
  const safeEpisode = episodeNumbers.includes(provisionalEpisode)
    ? provisionalEpisode
    : episodeNumbers[0] || 1;
  const activeEpisodeGroup = getActiveEpisodeGroup(episodeNumbers, safeEpisode);
  const episodeGroups = buildEpisodeGroups(episodeNumbers);
  const episodes = await buildEpisodeItems({
    anime,
    miruroMetadata,
    episodeNumbers: episodeNumbers.filter(
      (episodeNumber) =>
        episodeNumber >= activeEpisodeGroup.start &&
        episodeNumber <= activeEpisodeGroup.end
    ),
  });
  const currentEpisodeIndex = episodeNumbers.indexOf(safeEpisode);
  const previousEpisode =
    currentEpisodeIndex > 0 ? episodeNumbers[currentEpisodeIndex - 1] : null;
  const nextEpisode =
    currentEpisodeIndex >= 0 && currentEpisodeIndex < episodeNumbers.length - 1
      ? episodeNumbers[currentEpisodeIndex + 1]
      : null;
  const relations =
    anime.relations?.edges
      ?.filter((edge: RelationEdge) => Boolean(edge.node))
      .slice(0, 8) || [];
  const seasonItems = relations.filter((edge: RelationEdge) =>
    ["PREQUEL", "SEQUEL", "SIDE_STORY", "PARENT", "SPIN_OFF", "OTHER"].includes(
      edge.relationType
    )
  );
  const watchPath = (episodeNumber: number) => buildWatchPath(anime, episodeNumber);
  const episodeListItems = episodes.map((episode) => ({
    ...episode,
    href: watchPath(episode.number),
  }));
  const episodeListGroups = episodeGroups.map((group) => ({
    ...group,
    href: watchPath(group.start),
    isActive:
      group.start === activeEpisodeGroup.start &&
      group.end === activeEpisodeGroup.end,
  }));
  const renderEpisodesList = (className?: string) => (
    <WatchEpisodeList
      className={className}
      episodes={episodeListItems}
      groups={episodeListGroups}
      currentEpisode={safeEpisode}
      totalEpisodes={totalEpisodes}
    />
  );

  const renderSeasonsSection = (isSidebar: boolean) => {
    if (seasonItems.length === 0) return null;

    return (
      <section className={`space-y-4 ${isSidebar ? "hidden xl:block" : "block xl:hidden"}`}>
        <h2 className={`${isSidebar ? "text-base" : "text-xl"} font-bold text-white`}>
          Seasons, Movies, and Specials
        </h2>
        <div className={isSidebar ? "grid gap-3 grid-cols-1" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
          {seasonItems.slice(0, 6).map((edge: RelationEdge) =>
            edge.node ? (
              <CompactAnimeLink
                key={`${edge.relationType}-${edge.node.id}`}
                anime={edge.node}
                label={getRelationLabel(edge.relationType)}
              />
            ) : null
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#111111] pt-24 text-white">
      <section className="container px-4 pb-12 md:px-8 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/anime/${anime.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Link>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <Server className="h-4 w-4" />
            {streamSource.provider} player
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <StreamPlayer
              key={`${anime.id}-${safeEpisode}-${streamSource.url || "empty"}`}
              source={streamSource}
              title={`${title} episode ${safeEpisode}`}
              fallbackPoster={anime.bannerImage || anime.coverImage.extraLarge}
              basePath={watchPath(safeEpisode)}
            />

            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {anime.format}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {anime.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white capitalize">
                    {streamSource.provider.toLowerCase() === "miruro" ? "Player" : streamSource.provider}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {streamSource.type}
                  </Badge>
                  <span className="text-sm text-white/55">
                    {totalEpisodes} episodes
                  </span>
                </div>
                <h2 className="text-xl font-semibold">
                  Episode {safeEpisode}: {title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  render={
                    previousEpisode ? (
                      <Link href={watchPath(previousEpisode)} />
                    ) : undefined
                  }
                  variant="outline"
                  className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={!previousEpisode}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  render={
                    nextEpisode ? (
                      <Link href={watchPath(nextEpisode)} />
                    ) : undefined
                  }
                  className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
                  disabled={!nextEpisode}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {renderEpisodesList("block xl:hidden")}

            {/* Clean Detail Info Section */}
            <div className="flex flex-col md:flex-row gap-6 pt-4">
              {/* Left Column - Poster & Actions */}
              <div className="w-44 md:w-52 flex-shrink-0 mx-auto md:mx-0">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative">
                  <img
                    src={anime.coverImage.extraLarge || anime.coverImage.large}
                    alt={title}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
                <div className="mt-4">
                  <Button
                    render={<Link href={`/anime/${anime.id}`} />}
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold gap-2 h-11 rounded-xl transition-all"
                  >
                    Detail Info
                  </Button>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="flex-1 space-y-5">
                <div className="space-y-2 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                    {title}
                  </h1>
                  {anime.title.native && (
                    <p className="text-sm text-white/45 font-medium">
                      {anime.title.native}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs font-semibold text-white/60">
                  {anime.averageScore && (
                    <>
                      <span className="text-yellow-500">★ {anime.averageScore / 10}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{anime.format}</span>
                  <span>•</span>
                  <span>{anime.season} {anime.seasonYear}</span>
                  {anime.episodes && (
                    <>
                      <span>•</span>
                      <span>{anime.episodes} EPS</span>
                    </>
                  )}
                  <span>•</span>
                  <span className={anime.status === "RELEASING" ? "text-amber-500" : ""}>
                    {anime.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
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

            {renderSeasonsSection(false)}
          </div>

          <aside className="space-y-6">
            {renderEpisodesList("hidden xl:block")}
            {renderSeasonsSection(true)}
          </aside>
        </div>
      </section>
    </div>
  );
}
