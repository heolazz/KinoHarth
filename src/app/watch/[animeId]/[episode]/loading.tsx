import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronLeft, ChevronRight, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WatchLoading() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#111111] pt-24 text-white">
      <section className="container mx-auto w-full px-4 pb-12 md:px-8 lg:px-12">
        
        {/* Top Navigation Bar Skeleton */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-white/50">
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </div>
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Server className="h-4 w-4" />
            Loading server...
          </div>
        </div>

        {/* Player Layout Container */}
        <div className="flex flex-col xl:flex-row xl:gap-6 xl:items-start">
          
          {/* Main Player Area */}
          <div className="flex-1 min-w-0">
            {/* The Video Player Skeleton */}
            <Skeleton className="aspect-video w-full rounded-2xl bg-white/[0.04] shadow-2xl" />

            {/* Episode Title & Controls Skeleton */}
            <div className="flex flex-col gap-4 pb-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded bg-white/[0.05]" />
                  <Skeleton className="h-6 w-20 rounded bg-white/[0.05]" />
                  <Skeleton className="h-6 w-16 rounded bg-white/[0.05]" />
                </div>
                <Skeleton className="h-8 w-64 rounded bg-white/[0.05]" />
              </div>

              <div className="flex w-full items-center gap-3 sm:w-auto">
                <Button disabled variant="outline" className="h-10 flex-1 justify-center gap-2 rounded-full border-white/10 bg-white/5 px-5 text-white/50 sm:flex-none">
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button disabled className="h-10 flex-1 justify-center gap-2 rounded-full bg-white/20 px-5 text-white/50 sm:flex-none">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Anime Detail Info Below Player */}
            <div className="mt-6 flex flex-col gap-6 border-t border-white/5 pt-8 md:mt-6 md:flex-row md:pt-12">
              <div className="mx-auto w-44 flex-shrink-0 md:mx-0 md:w-52">
                <Skeleton className="relative aspect-[3/4] w-full rounded-xl bg-white/[0.05] shadow-2xl" />
              </div>
              <div className="flex-1 space-y-5">
                <div className="space-y-3 text-center md:text-left">
                  <Skeleton className="mx-auto h-8 w-3/4 rounded bg-white/[0.05] md:mx-0 md:h-10" />
                  <Skeleton className="mx-auto h-4 w-1/2 rounded bg-white/[0.03] md:mx-0" />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <Skeleton className="h-5 w-48 rounded bg-white/[0.05]" />
                </div>
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-full rounded bg-white/[0.03]" />
                  <Skeleton className="h-4 w-[95%] rounded bg-white/[0.03]" />
                  <Skeleton className="h-4 w-[80%] rounded bg-white/[0.03]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Episode List Skeleton (Visible on Desktop) */}
          <div className="hidden xl:flex xl:w-[350px] xl:shrink-0 xl:flex-col">
            <Skeleton className="h-[600px] w-full rounded-2xl bg-white/[0.03]" />
          </div>

        </div>
      </section>
    </div>
  );
}
