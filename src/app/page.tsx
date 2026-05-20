import { HomeClient } from "@/app/home-client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;

  return <HomeClient day={params.day} />;
}
