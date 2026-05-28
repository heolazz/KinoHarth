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
            
            {/* Base Dark Overlay + Blur */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-500 backdrop-blur-[1px] group-hover:backdrop-blur-[3px]" />

            {/* Color Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${studio.color} to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80`} />
            
            {/* Inner Glass Border */}
            <div className="absolute inset-0 border border-white/10 rounded-xl group-hover:border-white/20 transition-colors duration-500 z-10" />
            
            {/* Shimmer / Sweep Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-10" />
            <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 skew-x-12" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
              {studio.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={studio.logoImage} 
                  alt={`${studio.name} logo`}
                  className="max-h-[2.5rem] md:max-h-[3.5rem] w-auto max-w-[85%] object-contain transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-3 drop-shadow-2xl filter brightness-0 invert"
                />
              ) : (
                <span className="text-lg md:text-2xl font-black text-white tracking-widest uppercase text-center drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-3">
                  {studio.logoText}
                </span>
              )}
              
              {/* Explore Pill */}
              <div className="absolute bottom-4 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-2xl">
                <span>Explore</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Bottom accent glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-white/50 group-hover:w-1/3 transition-all duration-700 shadow-[0_0_8px_2px_rgba(255,255,255,0.3)] z-20" />
          </Link>
        ))}
      </div>
    </section>
  );
}
