import { Anime, AnimeStreamingEpisode, getAnimeDetail } from "@/services/anilist";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
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
import { buildWatchPath, slugifyTitle, getAnimeTitle } from "@/lib/watch-path";
import { getMiruroAnimeEpisodeMetadata, MiruroAnimeEpisodeMetadata } from "@/services/miruro";
import { getBestTmdbEpisodeThumbnail } from "@/services/tmdb";
import Link from "next/link";

const EPISODES_PER_PAGE = 20;

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

type EpisodePreview = {
  number: number;
  title: string;
  thumbnail: string | null;
  site?: string;
};

type HydratedEpisodePreview = EpisodePreview & {
  thumbnail: string;
};

type EpisodeSearchParams = {
  episodePage?: string | string[];
  episodeSearch?: string | string[];
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

  return Promise.all(
    episodes.map(async (episode): Promise<HydratedEpisodePreview> => {
      const tmdbThumbnail =
        episode.thumbnail || !tmdbId || !tmdbSeason
          ? null
          : await getBestTmdbEpisodeThumbnail({
            seriesId: tmdbId,
            seasonNumber: tmdbSeason,
            episodeNumber: episode.number,
          });

      return {
        ...episode,
        thumbnail: episode.thumbnail || tmdbThumbnail || fallbackThumbnail,
      };
    })
  );
}

function filterEpisodes(episodes: EpisodePreview[], searchTerm: string) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return episodes;
  }

  return episodes.filter(
    (episode) =>
      String(episode.number).includes(query) ||
      episode.title.toLowerCase().includes(query)
  );
}

function getEpisodePage(pageValue: string | undefined, totalPages: number) {
  const page = Number(pageValue);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, totalPages);
}

function buildDetailHref({
  anime,
  episodePage,
  episodeSearch,
}: {
  anime: Anime;
  episodePage?: number;
  episodeSearch?: string;
}) {
  const params = new URLSearchParams();

  if (episodeSearch) {
    params.set("episodeSearch", episodeSearch);
  }

  if (episodePage && episodePage > 1) {
    params.set("episodePage", String(episodePage));
  }

  const query = params.toString();
  const path = `/anime/${anime.id}/${slugifyTitle(getAnimeTitle(anime))}`;

  return query ? `${path}?${query}` : path;
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

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  return `${hours}h`;
}

export default async function AnimeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; slug?: string[] }>;
  searchParams: Promise<EpisodeSearchParams>;
}) {
  const { id, slug } = await params;
  const resolvedSearchParams = await searchParams;
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
  const episodeSearch = getSearchParamValue(resolvedSearchParams.episodeSearch)?.trim() || "";
  const episodeLabel = anime.episodes
    ? `${anime.episodes} total episodes`
    : anime.status === "RELEASING"
      ? "Episode count TBA"
      : "Episode info unavailable";
  const nextAiring = anime.nextAiringEpisode;
  const miruroMetadata = await getMiruroAnimeEpisodeMetadata(anime.id);
  const episodePreviews = buildEpisodePreviews(anime, miruroMetadata);
  const filteredEpisodePreviews = filterEpisodes(episodePreviews, episodeSearch);
  const totalEpisodePages = Math.max(
    1,
    Math.ceil(filteredEpisodePreviews.length / EPISODES_PER_PAGE)
  );
  const currentEpisodePage = getEpisodePage(
    getSearchParamValue(resolvedSearchParams.episodePage),
    totalEpisodePages
  );
  const firstEpisodeIndex = (currentEpisodePage - 1) * EPISODES_PER_PAGE;
  const visibleEpisodePreviews = await hydrateEpisodeThumbnails({
    anime,
    episodes: filteredEpisodePreviews.slice(
      firstEpisodeIndex,
      firstEpisodeIndex + EPISODES_PER_PAGE
    ),
    tmdbId: miruroMetadata?.tmdbId,
    tmdbSeason: miruroMetadata?.tmdbSeason,
  });
  const hasEpisodePagination = totalEpisodePages > 1;

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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm md:hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      </section>

      {/* Content Section */}
      <section className="container px-4 relative z-10 -mt-32 md:-mt-48 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Poster & Actions */}
          <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
              <img
                src={anime.coverImage.extraLarge}
                alt={title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="mt-6 space-y-3">
              <Button
                render={<Link href={buildWatchPath(anime, 1)} />}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-12 rounded-xl"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </Button>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 space-y-6 md:pt-24">
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
          <div className="mt-16 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Episodes</h2>

              <form
                action={buildDetailHref({ anime })}
                className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                  <Search className="h-4 w-4 shrink-0 text-white/45" />
                  <input
                    type="search"
                    name="episodeSearch"
                    defaultValue={episodeSearch}
                    placeholder="Search episode number or title"
                    className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-9 rounded-xl bg-white px-4 text-black hover:bg-white/90"
                >
                  Search
                </Button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/50">
              <span>
                {filteredEpisodePreviews.length} of {episodePreviews.length} episodes
              </span>
              {hasEpisodePagination && (
                <span>
                  Page {currentEpisodePage} of {totalEpisodePages}
                </span>
              )}
            </div>

            {visibleEpisodePreviews.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleEpisodePreviews.map((episode) => (
                  <Link
                    key={episode.number}
                    href={buildWatchPath(anime, episode.number)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="relative aspect-video overflow-hidden bg-black/30">
                      <img
                        src={episode.thumbnail}
                        alt={episode.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        <Play className="h-3.5 w-3.5 fill-current" />
                        EP {episode.number}
                      </div>
                    </div>

                    <div className="space-y-1.5 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-primary">
                        {episode.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {episode.site ? `Source: ${episode.site}` : "TMDB preview"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
                No episodes match your search.
              </div>
            )}

            {hasEpisodePagination && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  render={
                    currentEpisodePage > 1 ? (
                      <Link
                        href={buildDetailHref({
                          anime,
                          episodeSearch,
                          episodePage: currentEpisodePage - 1,
                        })}
                      />
                    ) : undefined
                  }
                  variant="outline"
                  className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={currentEpisodePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                {Array.from({ length: totalEpisodePages }, (_, index) => index + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalEpisodePages ||
                      Math.abs(page - currentEpisodePage) <= 1
                  )
                  .map((page, index, pages) => {
                    const previousPage = pages[index - 1];
                    const needsGap = previousPage && page - previousPage > 1;

                    return (
                      <span key={page} className="flex items-center gap-2">
                        {needsGap && <span className="text-sm text-white/35">...</span>}
                        <Link
                          href={buildDetailHref({
                            anime,
                            episodeSearch,
                            episodePage: page,
                          })}
                          className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors ${page === currentEpisodePage
                              ? "border-white bg-white text-black"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          {page}
                        </Link>
                      </span>
                    );
                  })}

                <Button
                  render={
                    currentEpisodePage < totalEpisodePages ? (
                      <Link
                        href={buildDetailHref({
                          anime,
                          episodeSearch,
                          episodePage: currentEpisodePage + 1,
                        })}
                      />
                    ) : undefined
                  }
                  className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
                  disabled={currentEpisodePage >= totalEpisodePages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
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
