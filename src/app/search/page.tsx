import { SearchClient } from "@/app/search/search-client";

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

  return <SearchClient query={query} />;
}
