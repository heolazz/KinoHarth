import Link from "next/link";
import { Anime } from "@/services/anilist";
import { cn } from "@/lib/utils";

interface AnimeCardProps {
  anime: Anime;
  className?: string;
}

export function AnimeCard({ anime, className }: AnimeCardProps) {
  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const isNewSeason = anime.status === "RELEASING" || (anime.seasonYear === 2024 && anime.season === "SPRING");

  return (
    <Link href={`/anime/${anime.id}`} className={cn("group flex flex-col gap-3", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-muted/20 transition-all duration-500">
        <img
          src={anime.coverImage.extraLarge || anime.coverImage.large}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* New Season Badge */}
        {isNewSeason && (
          <div className="absolute top-3 right-3 bg-[#3d2420]/80 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium px-3 py-1 rounded-full shadow-lg">
            New Season
          </div>
        )}
      </div>

      <div className="space-y-0.5 px-1">
        <h3 className="font-medium text-base text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}
