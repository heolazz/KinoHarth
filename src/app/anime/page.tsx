import { AnimeCatalogClient } from "@/app/anime/anime-catalog-client";

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
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;

  return (
    <AnimeCatalogClient
      params={{
        q: readParam(params.q),
        genre: readParam(params.genre),
        status: readParam(params.status),
        format: readParam(params.format),
        page: Math.max(Number(readParam(params.page)) || 1, 1),
      }}
    />
  );
}
