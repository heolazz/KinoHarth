import { Skeleton } from "@/components/ui/skeleton";

export default function AnimeCatalogLoading() {
  return (
    <div className="min-h-screen bg-[#141414] px-4 pb-20 pt-28 md:px-8 lg:px-12">
      <section className="container mx-auto space-y-8">
        
        {/* Header Block Skeleton */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-6">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-6 w-24 bg-white/[0.05]" />
            <Skeleton className="h-10 sm:h-12 w-3/4 max-w-sm bg-white/[0.05]" />
            <Skeleton className="h-4 w-full max-w-md bg-white/[0.05]" />
          </div>
          <div className="w-full max-w-md shrink-0">
            <Skeleton className="h-11 w-full rounded-full bg-white/[0.05]" />
          </div>
        </div>

        {/* Catalog Main Layout */}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          
          {/* Filters Sidebar Skeleton (Desktop) */}
          <aside className="hidden lg:block space-y-8">
            <Skeleton className="h-6 w-32 bg-white/[0.05]" />
            <div className="space-y-6 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-20 bg-white/[0.05]" />
                  <Skeleton className="h-10 w-full rounded-xl bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </aside>

          {/* Results Area Skeleton */}
          <main className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <Skeleton className="h-8 w-24 bg-white/[0.05]" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md bg-white/[0.05]" />
                <Skeleton className="h-8 w-8 rounded-md bg-white/[0.05]" />
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3 w-full">
                  <Skeleton className="aspect-[3/4] w-full rounded-xl bg-white/[0.03]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-4/5 bg-white/[0.03]" />
                    <Skeleton className="h-3 w-2/5 bg-white/[0.03]" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
