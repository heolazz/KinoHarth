import Link from "next/link";
import { Tv } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-transparent mt-auto relative z-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Tv className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">KinoHarth</span>
            </Link>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              KinoHarth is a modern anime streaming platform offering cinematic experiences with zero compromises. High-quality streaming, tracking, and discovery.
            </p>
            <div className="flex items-center gap-4 text-white/60">
              <Link href="#" className="hover:text-primary transition-colors">
                <span className="sr-only">Social</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white/90">Navigation</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/anime" className="hover:text-primary transition-colors">Catalog</Link></li>
              <li><Link href="/#trending" className="hover:text-primary transition-colors">Trending</Link></li>
              <li><Link href="/#recently-updated" className="hover:text-primary transition-colors">Recently Updated</Link></li>
              <li><Link href="/#schedule" className="hover:text-primary transition-colors">Schedule</Link></li>
              <li><Link href="/#popular" className="hover:text-primary transition-colors">Popular</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white/90">Legal</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/dmca" className="hover:text-primary transition-colors">DMCA</Link></li>
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
