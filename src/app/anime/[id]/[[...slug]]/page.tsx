import { Anime, AnimeStreamingEpisode, getAnimeDetail } from "@/services/anilist";
import { notFound, redirect } from "next/navigation";
import {
  Star,
  Play,
  Calendar,
  Tv,
  Clock,
  ListVideo,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimeCard } from "@/components/anime/anime-card";
import { EpisodeBrowser } from "@/components/anime/episode-browser";
import { buildWatchPath, slugifyTitle, getAnimeTitle } from "@/lib/watch-path";
import { getMiruroAnimeEpisodeMetadata, MiruroAnimeEpisodeMetadata } from "@/services/miruro";
import { getTmdbSeasonThumbnails } from "@/services/tmdb";
import Link from "next/link";

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

type EpisodePreview = {
  number: number;
  title: string;
  thumbnail: string | null;
  site?: string;
};

type HydratedEpisodePreview = EpisodePreview & {
  thumbnail: string;
};

const MAX_DETAIL_TMDB_THUMBNAILS = 60;

function getEpisodeNumber(episode: AnimeStreamingEpisode, fallbackNumber: number) {
  const titleMatch = episode.title.match(/\b(?:episode|ep\.?|#)\s*(\d+)\b/i);

  if (titleMatch) {
    return Number(titleMatch[1]);
  }

  const urlMatch = episode.url.match(/(?:episode|ep)[-/_.]?(\d+)|[?&](?:ep|episode)=(\d+)/i);
  const urlNumber = urlMatch ? Number(urlMatch[1] || urlMatch[2]) : Number.NaN;

  return Number.isInteger(urlNumber) && urlNumber > 0 ? urlNumber : fallbackNumber;
}

function getKnownEpisodeTotal(anime: Anime) {
  if (anime.episodes) {
    return anime.episodes;
  }

  if (anime.nextAiringEpisode?.episode && anime.nextAiringEpisode.episode > 1) {
    return anime.nextAiringEpisode.episode - 1;
  }

  return 0;
}

function buildEpisodePreviews(
  anime: Anime & { streamingEpisodes?: AnimeStreamingEpisode[] | null },
  miruroMetadata: MiruroAnimeEpisodeMetadata | null
) {
  const streamingEpisodes = anime.streamingEpisodes || [];
  const streamingByNumber = new Map<number, AnimeStreamingEpisode>();
  const miruroByNumber = new Map(
    (miruroMetadata?.episodes || []).map((episode) => [episode.number, episode])
  );

  streamingEpisodes.forEach((episode, index) => {
    const number = getEpisodeNumber(episode, index + 1);

    if (!streamingByNumber.has(number)) {
      streamingByNumber.set(number, episode);
    }
  });

  const knownTotal = getKnownEpisodeTotal(anime);
  const highestStreamingEpisode =
    streamingByNumber.size > 0 ? Math.max(...Array.from(streamingByNumber.keys())) : 0;
  const highestMiruroEpisode =
    miruroByNumber.size > 0 ? Math.max(...Array.from(miruroByNumber.keys())) : 0;
  const totalEpisodes = Math.max(knownTotal, highestStreamingEpisode, highestMiruroEpisode);
  const episodeNumbers =
    totalEpisodes > 0
      ? Array.from({ length: totalEpisodes }, (_, index) => index + 1)
      : Array.from(new Set([...streamingByNumber.keys(), ...miruroByNumber.keys()])).sort(
        (a, b) => a - b
      );

  return episodeNumbers.map((number): EpisodePreview => {
    const streamingEpisode = streamingByNumber.get(number);
    const miruroEpisode = miruroByNumber.get(number);

    return {
      number,
      title: miruroEpisode?.title || streamingEpisode?.title || `Episode ${number}`,
      thumbnail: miruroEpisode?.image || streamingEpisode?.thumbnail || null,
      site: miruroEpisode
        ? `${miruroEpisode.provider}/${miruroEpisode.category}`
        : streamingEpisode?.site,
    };
  });
}

function getFallbackThumbnail(anime: Anime) {
  return anime.bannerImage || anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium;
}

async function hydrateEpisodeThumbnails({
  anime,
  episodes,
  tmdbId,
  tmdbSeason,
}: {
  anime: Anime;
  episodes: EpisodePreview[];
  tmdbId?: number;
  tmdbSeason?: number;
}) {
  const fallbackThumbnail = getFallbackThumbnail(anime);
  const shouldHydrateFromTmdb = episodes.length <= MAX_DETAIL_TMDB_THUMBNAILS;

  const seasonThumbnails =
    tmdbId && tmdbSeason && shouldHydrateFromTmdb
      ? await getTmdbSeasonThumbnails({
          seriesId: tmdbId,
          seasonNumber: tmdbSeason,
        })
      : null;

  return episodes.map((episode): HydratedEpisodePreview => {
    const tmdbThumbnail =
      episode.thumbnail || !seasonThumbnails
        ? null
        : seasonThumbnails[episode.number];

    return {
      ...episode,
      thumbnail: episode.thumbnail || tmdbThumbnail || fallbackThumbnail,
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

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatEnum(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getInfoValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function DetailInfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const displayValue = getInfoValue(value);

  if (!displayValue) {
    return null;
  }

  return (
    <div className="space-y-1 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-white/40">
        {label}
      </dt>
      <dd className="text-sm font-semibold leading-snug text-white">
        {displayValue}
      </dd>
    </div>
  );
}

function DetailInfoList({
  label,
  values,
}: {
  label: string;
  values: (string | null | undefined)[];
}) {
  const displayValues = values.filter(Boolean) as string[];

  if (displayValues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-white/40">
        {label}
      </dt>
      <dd className="flex flex-col gap-1.5 text-sm font-semibold leading-snug text-white">
        {displayValues.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </dd>
    </div>
  );
}

function getStudioNames(anime: Anime) {
  return (
    anime.studios?.nodes
      ?.filter((studio) => studio.isAnimationStudio)
      .map((studio) => studio.name) || []
  );
}

function getDurationLabel(duration: number | null | undefined) {
  return duration ? `${duration} mins` : null;
}

function getStatusLabel(status: string | null | undefined) {
  return formatEnum(status);
}

function getStartDateLabel(startDate: Anime["startDate"]) {
  if (!startDate || !startDate.year) {
    return null;
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (startDate.month && startDate.day) {
    const monthStr = months[startDate.month - 1] || "";
    return `${monthStr} ${startDate.day}, ${startDate.year}`;
  } else if (startDate.month) {
    const monthStr = months[startDate.month - 1] || "";
    return `${monthStr} ${startDate.year}`;
  }

  return String(startDate.year);
}

function getDetailInfoGroups(anime: Anime) {
  return {
    studios: getStudioNames(anime),
  };
}

function getSourceLabel(source: string | null | undefined) {
  return formatEnum(source);
}

function DetailInfoPanel({ anime }: { anime: Anime }) {
  const detailGroups = getDetailInfoGroups(anime);

  return (
    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 md:flex md:flex-col md:space-y-4 px-1 max-w-sm mx-auto md:max-w-none">
      <DetailInfoItem label="Status" value={getStatusLabel(anime.status)} />
      <DetailInfoItem label="Episode Duration" value={getDurationLabel(anime.duration)} />
      <DetailInfoItem label="Start Date" value={getStartDateLabel(anime.startDate)} />
      <DetailInfoList label="Studios" values={detailGroups.studios} />
      <DetailInfoItem label="Source" value={getSourceLabel(anime.source)} />
    </dl>
  );
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug?: string[] }>;
}) {
  const { id, slug } = await params;
  const data = await getAnimeDetail(parseInt(id));
  const anime = data?.Media;

  if (!anime) {
    notFound();
  }

  const expectedSlug = slugifyTitle(getAnimeTitle(anime));
  const currentSlug = slug?.[0];

  if (currentSlug !== expectedSlug) {
    redirect(`/anime/${id}/${expectedSlug}`);
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
  const miruroMetadata = await getMiruroAnimeEpisodeMetadata(anime.id);
  const episodePreviews = buildEpisodePreviews(anime, miruroMetadata);
  const hydratedEpisodePreviews = await hydrateEpisodeThumbnails({
    anime,
    episodes: episodePreviews,
    tmdbId: miruroMetadata?.tmdbId,
    tmdbSeason: miruroMetadata?.tmdbSeason,
  });
  const episodeBrowserItems = hydratedEpisodePreviews.map((episode) => ({
    ...episode,
    href: buildWatchPath(anime, episode.number),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section */}
      <section className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px]">
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

      {/* Content Section */}
      <section className="container px-4 relative z-10 -mt-40 sm:-mt-44 md:-mt-48 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Poster & Actions */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="w-56 sm:w-64 md:w-full aspect-[2/3] mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
              <img
                src={anime.coverImage.extraLarge}
                alt={title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="mt-6 max-w-sm mx-auto md:max-w-none space-y-3">
              <Button
                render={<Link href={buildWatchPath(anime, 1)} />}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-12 rounded-xl"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </Button>
            </div>
            <DetailInfoPanel anime={anime} />
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                {title}
              </h1>
              {anime.title.native && (
                <p className="text-lg text-muted-foreground font-medium">
                  {anime.title.native}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
              {anime.averageScore && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{anime.averageScore / 10}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Tv className="w-4 h-4" />
                <span>{anime.format}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{anime.season} {anime.seasonYear}</span>
              </div>
              {anime.episodes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{anime.episodes} EPS</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className={anime.status === "RELEASING" ? "text-primary" : ""}>
                  {anime.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {anime.genres.map((genre: string) => (
                <Badge key={genre} variant="secondary" className="bg-secondary/50 hover:bg-secondary">
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
                    <p className="text-sm text-muted-foreground">
                      {formatAiringDate(nextAiring.airingAt)} ({formatTimeUntilAiring(nextAiring.timeUntilAiring)})
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
              <h3 className="font-semibold text-lg">Synopsis</h3>
              <p
                className="text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: anime.description || "No description available." }}
              />
            </div>

            {/* Trailer Section */}
            {anime.trailer && anime.trailer.site === "youtube" && (
              <div className="pt-4 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-primary" />
                  Trailer
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
                  <iframe
                    src={`https://www.youtube.com/embed/${anime.trailer.id}?autoplay=0&showinfo=0&controls=1&rel=0`}
                    title={`${title} Trailer`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Episodes Section */}
        {episodePreviews.length > 0 && (
          <EpisodeBrowser episodes={episodeBrowserItems} />
        )}

        {/* Characters Section */}
        {characterEdges.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Characters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {characterEdges.map((edge: CharacterEdge) => (
                <div key={edge.node.id} className="flex bg-muted/20 rounded-xl overflow-hidden h-24">
                  <img src={edge.node.image.large} alt={edge.node.name.full} className="w-16 object-cover" />
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{edge.node.name.full}</p>
                      <p className="text-xs text-muted-foreground">{edge.role}</p>
                    </div>
                  </div>
                  {edge.voiceActors?.[0] && (
                    <div className="flex-1 p-3 flex flex-col justify-between items-end text-right">
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{edge.voiceActors[0].name.full}</p>
                        <p className="text-xs text-muted-foreground">Japanese</p>
                      </div>
                    </div>
                  )}
                  {edge.voiceActors?.[0] && (
                    <img src={edge.voiceActors[0].image.large} alt={edge.voiceActors[0].name.full} className="w-16 object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Work */}
        {relationEdges.filter((edge) => edge.node?.type === "ANIME").length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Related Work</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-6 md:overflow-visible md:pb-0">
              {relationEdges
                .filter((edge) => edge.node?.type === "ANIME")
                .map((edge: RelationEdge) => {
                  const relAnime = edge.node;
                  return (
                    <div key={relAnime.id} className="w-[140px] shrink-0 md:w-auto md:shrink">
                      <AnimeCard anime={relAnime} />
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendationEdges.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Recommended</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {recommendationEdges.slice(0, 6).map((edge: RecommendationEdge) => {
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
