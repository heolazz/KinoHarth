import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const POPULAR_STUDIOS = [
  { 
    id: 21, 
    name: "Studio Ghibli", 
    slug: "studio-ghibli",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/164-Aj6MINy7VTfs.jpg",
    logoText: "Studio Ghibli",
    color: "from-blue-600/80"
  },
  { 
    id: 569, 
    name: "MAPPA", 
    slug: "mappa",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg",
    logoText: "MAPPA",
    color: "from-red-600/80"
  },
  { 
    id: 43, 
    name: "ufotable", 
    slug: "ufotable",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    logoText: "ufotable",
    color: "from-blue-800/80"
  },
  { 
    id: 858, 
    name: "WIT STUDIO", 
    slug: "wit-studio",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg",
    logoText: "WIT STUDIO",
    color: "from-amber-600/80"
  },
  { 
    id: 2, 
    name: "Kyoto Animation", 
    slug: "kyoto-animation",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/n101291-fqIUvQ6apEtD.jpg",
    logoText: "Kyoto Animation",
    color: "from-indigo-600/80"
  },
  { 
    id: 11, 
    name: "Madhouse", 
    slug: "madhouse",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-8WkkTZ6duKpq.jpg",
    logoText: "Madhouse",
    color: "from-slate-800/80"
  },
  { 
    id: 4, 
    name: "Bones", 
    slug: "bones",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg",
    logoText: "Bones",
    color: "from-neutral-800/80"
  },
  { 
    id: 1313, 
    name: "CloverWorks", 
    slug: "cloverworks",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/132405-LnPQaqaksEpN.jpg",
    logoText: "CloverWorks",
    color: "from-emerald-600/80"
  },
];

export function StudioSlider() {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          Explore by Studio
        </h2>
      </div>

      <div className="px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {POPULAR_STUDIOS.map((studio) => (
            <Link
              key={studio.id}
              href={`/studio/${studio.id}/${studio.slug}`}
              className="group relative overflow-hidden rounded-xl aspect-[16/9] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 block"
            >
              {/* Background Cover Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${studio.cover})` }}
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${studio.color} to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <span className="text-xl md:text-2xl font-black text-white tracking-widest uppercase text-center drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                  {studio.logoText}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
