import { Skeleton } from "@/components/ui/skeleton";

function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <Skeleton className="aspect-[3/4] w-full rounded-xl bg-white/[0.03]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5 bg-white/[0.03]" />
        <Skeleton className="h-3 w-2/5 bg-white/[0.03]" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#141414]">
      {/* Hero Slider Skeleton */}
      <Skeleton className="h-[75vh] w-full rounded-none bg-white/[0.02]" />

      {/* Main Content Area Skeleton */}
      <section className="container relative z-20 mx-auto -mt-4 px-4 pb-20 pt-12 md:px-6 space-y-16">
        
        {/* Trending Section Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-white/[0.03]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[200px] shrink-0 md:min-w-[220px] lg:min-w-[240px]">
                <AnimeCardSkeleton />
              </div>
            ))}
          </div>
        </div>

        {/* Popular Section Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-white/[0.03]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[200px] shrink-0 md:min-w-[220px] lg:min-w-[240px]">
                <AnimeCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
