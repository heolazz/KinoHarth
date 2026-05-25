import { AnimeCatalogClient } from "@/app/anime/anime-catalog-client";
import { getAnimeCatalog } from "@/services/anilist";

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return value?.trim() || "";
}

export default async function AnimeCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    genre?: string | string[];
    status?: string | string[];
    format?: string | string[];
    sort?: string | string[];
    season?: string | string[];
    year?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const catalogParams = {
    q: readParam(params.q),
    genre: readParam(params.genre),
    status: readParam(params.status),
    format: readParam(params.format),
    sort: readParam(params.sort),
    season: readParam(params.season),
    year: readParam(params.year),
    page: Math.max(Number(readParam(params.page)) || 1, 1),
  };
  
  const catalog = await getAnimeCatalog({
    page: catalogParams.page,
    perPage: 24,
    search: catalogParams.q || undefined,
    genre: catalogParams.genre || undefined,
    status: catalogParams.status || undefined,
    format: catalogParams.format || undefined,
    sort: catalogParams.sort ? [catalogParams.sort] : undefined,
    season: catalogParams.season || undefined,
    seasonYear: catalogParams.year ? Number(catalogParams.year) : undefined,
  });

  return (
    <AnimeCatalogClient
      params={catalogParams}
      initialData={{
        anime: catalog?.Page?.media || [],
        pageInfo: catalog?.Page?.pageInfo,
      }}
    />
  );
}
