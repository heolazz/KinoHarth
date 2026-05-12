import { Anime, getAnimeDetail } from "@/services/anilist";
import { notFound } from "next/navigation";
import { Star, Play, Calendar, Tv, Clock, ListVideo, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimeCard } from "@/components/anime/anime-card";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAnimeDetail(parseInt(id));
  const anime = data?.Media;

  if (!anime) {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const characterEdges = anime.characters?.edges || [];
  const recommendationEdges = anime.recommendations?.edges || [];
  const episodeLabel = anime.episodes
    ? `${anime.episodes} total episodes`
    : anime.status === "RELEASING"
      ? "Episode count TBA"
      : "Episode info unavailable";
  const nextAiring = anime.nextAiringEpisode;

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
                render={<Link href={`/watch/${anime.id}/1`} />}
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
