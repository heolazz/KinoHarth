import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Film,
  ListVideo,
  Server,
  Star,
  Tv,
} from "lucide-react";

import { AnimeCard } from "@/components/anime/anime-card";
import { StreamPlayer } from "@/components/anime/stream-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStreamSource } from "@/lib/stream-providers";
import { Anime, getAnimeDetail } from "@/services/anilist";

const DEFAULT_EPISODE_COUNT = 12;
const EPISODE_GROUP_SIZE = 100;

type RecommendationEdge = {
  node?: {
    mediaRecommendation?: Anime | null;
  } | null;
};

type RelationEdge = {
  relationType: string;
  node?: Anime | null;
};

function formatAniListDate(
  date:
    | {
        year?: number | null;
        month?: number | null;
        day?: number | null;
      }
    | null
    | undefined
) {
  if (!date?.year) {
    return "Unknown";
  }

  if (!date.month || !date.day) {
    return String(date.year);
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date.year, date.month - 1, date.day));
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

function buildEpisodeItems(episodeNumbers: number[], currentEpisode: number) {
  return episodeNumbers.map((episodeNumber) => ({
    number: episodeNumber,
    title:
      episodeNumber === currentEpisode
        ? "Now playing"
        : `Episode ${episodeNumber}`,
  }));
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
      className="group grid grid-cols-[56px_minmax(0,1fr)] gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-2 transition-all duration-300 hover:border-violet-500/20 hover:bg-violet-500/[0.03] backdrop-blur-md"
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
          <span className="mb-1.5 inline-block rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-400">
            {label}
          </span>
        )}
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-violet-300">
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
  const currentEpisode = Number(episode);
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
  const episodes = buildEpisodeItems(
    episodeNumbers.filter(
      (episodeNumber) =>
        episodeNumber >= activeEpisodeGroup.start &&
        episodeNumber <= activeEpisodeGroup.end
    ),
    safeEpisode
  );
  const currentEpisodeIndex = episodeNumbers.indexOf(safeEpisode);
  const previousEpisode =
    currentEpisodeIndex > 0 ? episodeNumbers[currentEpisodeIndex - 1] : null;
  const nextEpisode =
    currentEpisodeIndex >= 0 && currentEpisodeIndex < episodeNumbers.length - 1
      ? episodeNumbers[currentEpisodeIndex + 1]
      : null;
  const recommendations: Anime[] =
    anime.recommendations?.edges
      ?.map((edge: RecommendationEdge) => edge.node?.mediaRecommendation)
      .filter((recommendation: Anime | null | undefined): recommendation is Anime =>
        Boolean(recommendation)
      )
      .slice(0, 6) || [];
  const relations =
    anime.relations?.edges
      ?.filter((edge: RelationEdge) => Boolean(edge.node))
      .slice(0, 8) || [];
  const relatedItems = relations.slice(0, 4);
  const seasonItems = relations.filter((edge: RelationEdge) =>
    ["PREQUEL", "SEQUEL", "SIDE_STORY", "PARENT", "SPIN_OFF", "OTHER"].includes(
      edge.relationType
    )
  );
  const studioNames = anime.studios?.nodes?.map((studio) => studio.name).join(", ");
  const officialLink =
    anime.externalLinks?.find((link) => link.site.toLowerCase().includes("official")) ||
    anime.externalLinks?.find((link) => link.type === "INFO") ||
    null;
  const detailLink = officialLink?.url || anime.siteUrl;
  const detailLinkLabel = officialLink?.site || "AniList";
  const infoItems = [
    { label: "Format", value: formatEnum(anime.format) },
    { label: "Status", value: formatEnum(anime.status) },
    { label: "Episodes", value: `${totalEpisodes}` },
    {
      label: "Rating",
      value: anime.averageScore ? `${anime.averageScore} / 100` : "Unknown",
    },
    {
      label: "Duration",
      value: anime.duration ? `${anime.duration} min` : "Unknown",
    },
    {
      label: "Season",
      value:
        anime.season && anime.seasonYear
          ? `${formatEnum(anime.season)} ${anime.seasonYear}`
          : "Unknown",
    },
    { label: "Start Date", value: formatAniListDate(anime.startDate) },
    { label: "End Date", value: formatAniListDate(anime.endDate) },
    { label: "Country", value: anime.countryOfOrigin || "Unknown" },
    { label: "Adult", value: anime.isAdult ? "Yes" : "No" },
    { label: "Studios", value: studioNames || "Unknown" },
  ];

  const renderEpisodesList = (className?: string) => (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className || ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <ListVideo className="h-5 w-5 text-violet-400" />
          Episodes
        </h2>
        <span className="text-sm text-white/50">{totalEpisodes} total</span>
      </div>

      {episodeGroups.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {episodeGroups.map((group) => {
            const isActive =
              group.start === activeEpisodeGroup.start &&
              group.end === activeEpisodeGroup.end;

            return (
              <Link
                key={`${group.start}-${group.end}`}
                href={`/watch/${anime.id}/${group.start}`}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {group.start}-{group.end}
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid max-h-[440px] gap-2 overflow-y-auto pr-1">
        {episodes.map((item) => {
          const isActive = item.number === safeEpisode;

          return (
            <Link
              key={item.number}
              href={`/watch/${anime.id}/${item.number}`}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                isActive
                  ? "border-white/30 bg-white text-black"
                  : "border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isActive ? "bg-black text-white" : "bg-white/10 text-white"
                }`}
              >
                {item.number}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  Episode {item.number}
                </span>
                <span
                  className={`block truncate text-xs ${
                    isActive ? "text-black/60" : "text-white/45"
                  }`}
                >
                  {item.title}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );

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
              basePath={`/watch/${anime.id}/${safeEpisode}`}
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
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {streamSource.provider}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {streamSource.type}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-white/55">
                    <Clock className="h-4 w-4" />
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
                      <Link href={`/watch/${anime.id}/${previousEpisode}`} />
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
                      <Link href={`/watch/${anime.id}/${nextEpisode}`} />
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

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-white/60">
                  {anime.averageScore && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{anime.averageScore / 10}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Tv className="w-4 h-4 text-violet-400" />
                    <span>{anime.format}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    <span>{anime.season} {anime.seasonYear}</span>
                  </div>
                  {anime.episodes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span>{anime.episodes} EPS</span>
                    </div>
                  )}
                  <div>
                    <span className={anime.status === "RELEASING" ? "text-violet-400" : ""}>
                      {anime.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {anime.genres.slice(0, 5).map((genre) => (
                    <Badge
                      key={genre}
                      variant="secondary"
                      className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-500/20"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2 text-center md:text-left">
                  <h3 className="font-semibold text-base text-white">Synopsis</h3>
                  <p 
                    className="text-white/60 leading-relaxed text-sm"
                    dangerouslySetInnerHTML={{ __html: anime.description || "No description available." }}
                  />
                </div>

                <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 pt-4 border-t border-white/5">
                  {infoItems.map((item) => (
                    <div key={item.label} className="flex min-w-0 items-baseline gap-2 text-xs">
                      <span className="shrink-0 text-white/38">{item.label}:</span>
                      <span className="truncate font-semibold text-white/80">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex min-w-0 items-baseline gap-2 text-xs">
                    <span className="shrink-0 text-white/38">Detail Page:</span>
                    <Link
                      href={`/anime/${anime.id}`}
                      className="truncate font-bold text-white hover:text-violet-400 transition-colors"
                    >
                      View Full Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {seasonItems.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-violet-400" />
                  <h2 className="text-xl font-bold">Seasons, Movies, and Specials</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            )}
          </div>

          <aside className="space-y-6">
            {renderEpisodesList("hidden xl:block")}
          </aside>
        </div>
      </section>
    </div>
  );
}
