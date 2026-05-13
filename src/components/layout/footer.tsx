import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-transparent mt-auto relative z-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
              <Image
                src="/logo2.png"
                alt="KinoHarth Logo"
                width={200}
                height={100}
                className="w-auto h-32 object-contain"
                unoptimized
              />
            </Link>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              KinoHarth is a modern anime streaming platform offering cinematic experiences with zero compromises. High-quality streaming, tracking, and discovery.
            </p>
            <div className="flex items-center gap-4 text-white/60">
              <Link href="https://www.instagram.com/harits.taqiy/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <span className="sr-only">Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white/90">Navigation</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/anime" className="hover:text-primary transition-colors">Catalog</Link></li>
              <li><Link href="/#trending" className="hover:text-primary transition-colors">Trending</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white/90">Discover</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/#recently-updated" className="hover:text-primary transition-colors">Recently Updated</Link></li>
              <li><Link href="/#schedule" className="hover:text-primary transition-colors">Schedule</Link></li>
              <li><Link href="/#popular" className="hover:text-primary transition-colors">Popular</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/5 mt-12 pt-8 text-sm text-white/60">
          <p>© {new Date().getFullYear()} KinoHarth. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-4 md:mt-0">
            Made by Harth
          </p>
        </div>
      </div>
    </footer>
  );
}
