import { Metadata } from "next";
import { StudioClient } from "./client";
import { getAnimeByStudio } from "@/services/anilist";
import { POPULAR_STUDIOS } from "@/lib/constants/studios";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const studioId = parseInt(id, 10);
  const studio = POPULAR_STUDIOS.find((s) => s.id === studioId);
  const title = studio ? `${studio.name} Anime` : "Studio Anime";

  return {
    title: `${title} - KinoHarth`,
    description: `Watch popular anime by ${studio?.name || "this studio"} on KinoHarth.`,
  };
}

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const studioId = parseInt(id, 10);
  const studio = POPULAR_STUDIOS.find((s) => s.id === studioId);
  
  // Initial fetch for server-side rendering
  const initialData = await getAnimeByStudio(studioId, 1, 24);

  return <StudioClient studioId={studioId} studio={studio} initialData={initialData} />;
}
