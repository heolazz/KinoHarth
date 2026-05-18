import type { Anime } from "@/services/anilist";

export function slugifyTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "anime";
}

export function getAnimeTitle(anime: Anime) {
  return anime.title.english || anime.title.romaji || anime.title.native || "Anime";
}

export function buildWatchPath(anime: Anime, episode: number) {
  return `/watch/${anime.id}/${slugifyTitle(getAnimeTitle(anime))}/episode-${episode}`;
}

export function parseEpisodeSegment(segment: string) {
  const directEpisode = Number(segment);

  if (Number.isInteger(directEpisode)) {
    return directEpisode;
  }

  const match = segment.match(/\d+$/);

  return match ? Number(match[0]) : Number.NaN;
}
