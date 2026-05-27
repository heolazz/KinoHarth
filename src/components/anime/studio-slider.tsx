"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { POPULAR_STUDIOS } from "@/lib/constants/studios";

export function StudioSlider() {
  return (
    <section className="space-y-6">
      {/* Section Header — matches "Trending Now" pattern */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white/95 flex items-center gap-2">
          Explore by Studio
        </h2>
      </div>

      {/* Studio Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {POPULAR_STUDIOS.map((studio) => (
          <Link
            key={studio.id}
            href={`/studio/${studio.id}/${studio.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-[16/9] block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Background Cover */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
              style={{ backgroundImage: `url(${studio.cover})` }}
            />
            
            {/* Color Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${studio.color} to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90`} />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/50 group-hover:via-black/10 transition-all duration-300" />
            
            {/* Subtle shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
              <span className="text-base md:text-xl lg:text-2xl font-black text-white tracking-wider uppercase text-center drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
                {studio.logoText}
              </span>
              
              {/* Explore arrow — visible on hover */}
              <div className="mt-2 flex items-center gap-1 text-xs text-white/0 group-hover:text-white/80 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="font-medium">Explore</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}
