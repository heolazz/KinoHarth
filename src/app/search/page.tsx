import { SearchClient } from "@/app/search/search-client";
import { searchAnime } from "@/services/anilist";

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return value?.trim() || "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = normalizeSearchParam((await searchParams).q);
  const results = query ? await searchAnime(query, 1, 24) : null;
  const media = results?.Page?.media || [];

  return (
    <SearchClient
      query={query}
      initialData={{
        results: media,
        total: results?.Page?.pageInfo?.total || media.length,
      }}
    />
  );
}
