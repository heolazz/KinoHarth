import Image from "next/image";
import Link from "next/link";
import { Anime } from "@/services/anilist";
import { cn } from "@/lib/utils";
import { ClosedCaption, Star } from "lucide-react";

interface AnimeCardProps {
  anime: Anime;
  className?: string;
  variant?: "default" | "trending" | "grid";
  rank?: number;
}

export function AnimeCard({ anime, className, variant = "default", rank }: AnimeCardProps) {
  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const isNewSeason = variant !== "trending" && variant !== "grid" && (anime.status === "RELEASING" || (anime.seasonYear === 2024 && anime.season === "SPRING"));

  const formatMap: Record<string, string> = {
    TV: "TV",
    TV_SHORT: "TV_SHORT",
    MOVIE: "MOVIE",
    SPECIAL: "SPECIAL",
    OVA: "OVA",
    ONA: "ONA",
    MUSIC: "MUSIC",
  };
  const displayFormat = anime.format ? formatMap[anime.format] || anime.format : "TV";
  
  const statusColorMap: Record<string, string> = {
    RELEASING: "bg-[#00E676]",
    FINISHED: "bg-[#2979FF]",
    NOT_YET_RELEASED: "bg-[#FFEA00]",
    CANCELLED: "bg-[#FF1744]",
    HIATUS: "bg-[#FF9100]",
  };
  const statusColor = anime.status ? statusColorMap[anime.status] || "bg-gray-500" : "bg-gray-500";

  if (variant === "grid") {
    return (
      <Link href={`/anime/${anime.id}`} className={cn("group flex flex-col gap-2.5", className)}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted/20 transition-all duration-500">
          <Image
            src={anime.coverImage.extraLarge || anime.coverImage.large}
            alt={title}
            fill
            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        
        <div className="px-0.5 space-y-1.5">
          <div className="flex items-start gap-1.5">
            <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", statusColor)} />
            <h3 className="font-bold text-[13px] sm:text-sm text-white/95 line-clamp-1 leading-snug group-hover:text-[#00E676] transition-colors">
              {title}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-white/40">
            <span>{displayFormat}</span>
            <span>{anime.seasonYear || "2024"}</span>
            {anime.episodes && (
              <span className="flex items-center gap-1">
                <span className="rounded-[3px] bg-white/10 px-1 py-0.5 text-[9px] leading-none text-white/70">CC</span>
                {anime.episodes}
              </span>
            )}
            {anime.averageScore && (
              <span className="flex items-center gap-1 ml-auto sm:ml-0">
                <Star className="w-3 h-3 text-white/30 fill-current" />
                {anime.averageScore}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/anime/${anime.id}`} className={cn("group flex flex-col gap-3", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-muted/20 transition-all duration-500">
        <Image
          src={anime.coverImage.extraLarge || anime.coverImage.large}
          alt={title}
          fill
          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Bottom Shadow for Rank Visibility */}
        {rank !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Rank Number */}
        {rank !== undefined && (
          <div className="absolute -bottom-2 left-2 z-10 pointer-events-none">
            <span 
              className="text-white font-black text-[5rem] tracking-tighter leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,1)]"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}
            >
              {rank}
            </span>
          </div>
        )}

        {/* New Season Badge */}
        {isNewSeason && (
          <div className="absolute top-3 right-3 bg-[#3d2420]/80 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium px-3 py-1 rounded-full shadow-lg">
            New Season
          </div>
        )}
      </div>

      {variant === "trending" ? (
        <div className="space-y-1.5 px-1">
          <div className="flex justify-between items-center text-sm text-white/60 font-medium">
            <span>{displayFormat}</span>
            <span>{anime.seasonYear || ""}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", statusColor)} />
            <h3 className="font-medium text-base text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors">
              {title}
            </h3>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 px-1">
          <h3 className="font-medium text-base text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>
      )}
    </Link>
  );
}
