import { Skeleton } from "@/components/ui/skeleton";

export default function AnimeDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#141414]">
      {/* Banner Section Skeleton */}
      <section className="relative h-[40vh] min-h-[300px] w-full md:h-[50vh]">
        <Skeleton className="absolute inset-0 bg-white/[0.03] rounded-none" />
      </section>

      {/* Main Content Area */}
      <section className="container relative z-10 -mt-40 px-4 pb-12 sm:-mt-44 md:-mt-48">
        <div className="flex flex-col gap-8 md:flex-row">
          
          {/* Left Sidebar (Poster & Info Panel) */}
          <div className="w-full flex-shrink-0 md:w-64">
            {/* Poster Skeleton */}
            <Skeleton className="mx-auto aspect-[2/3] w-56 rounded-xl bg-white/[0.05] shadow-2xl sm:w-64 md:w-full" />
            
            {/* Watch Button Skeleton */}
            <div className="mx-auto mt-6 max-w-sm md:max-w-none">
              <Skeleton className="h-12 w-full rounded-xl bg-white/[0.05]" />
            </div>
            
            {/* Detail Info Panel Skeleton */}
            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-x-6 gap-y-4 px-1 md:flex md:max-w-none md:flex-col md:space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 border-b border-white/5 pb-3">
                  <Skeleton className="h-3 w-16 bg-white/[0.03]" />
                  <Skeleton className="h-4 w-24 bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 space-y-8 pt-2 md:pt-4">
            
            {/* Title & Native Title Skeleton */}
            <div className="space-y-3 text-center md:text-left">
              <Skeleton className="mx-auto h-10 w-3/4 bg-white/[0.05] md:mx-0 md:h-12" />
              <Skeleton className="mx-auto h-5 w-1/3 bg-white/[0.03] md:mx-0" />
            </div>

            {/* Tags / Meta Skeleton */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-16 rounded bg-white/[0.05]" />
              ))}
            </div>

            {/* Genres Skeleton */}
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full bg-white/[0.05]" />
              ))}
            </div>

            {/* Info Boxes Skeleton */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-2xl bg-white/[0.04]" />
              <Skeleton className="h-24 rounded-2xl bg-white/[0.04]" />
            </div>

            {/* Synopsis Skeleton */}
            <div className="space-y-3 pt-4">
              <Skeleton className="h-6 w-24 bg-white/[0.05]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/[0.03]" />
                <Skeleton className="h-4 w-[90%] bg-white/[0.03]" />
                <Skeleton className="h-4 w-[95%] bg-white/[0.03]" />
                <Skeleton className="h-4 w-[80%] bg-white/[0.03]" />
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
