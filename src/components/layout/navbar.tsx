"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Menu, Search, ArrowLeft, Sparkles, Tv, Flame, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/anime", label: "Catalog" },
  { href: "/#trending", label: "Trending" },
  { href: "/#recently-updated", label: "Updated" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/#popular", label: "Popular" },
];

const futureLinks = ["My List"];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchPathname, setMobileSearchPathname] = useState(pathname);
  const isMobileSearchVisible = isMobileSearchOpen && mobileSearchPathname === pathname;
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500",
        isScrolled
          ? "bg-[#141414]/80 backdrop-blur-2xl border-b border-white/5 py-2 shadow-2xl"
          : "bg-gradient-to-b from-black/60 to-transparent py-3"
      )}
    >
      {/* Mobile Search Overlay */}
      {isMobileSearchVisible && (
        <div className="absolute inset-0 z-20 flex items-center px-4 bg-[#141414] animate-in slide-in-from-top-2 fade-in duration-200 md:hidden">
          <form action="/search" className="flex items-center w-full gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(false)}
              className="shrink-0 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              <Input
                name="q"
                autoFocus
                placeholder="Search anime..."
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/20 rounded-full pl-5 pr-10 h-10 text-sm placeholder:text-white/40 text-white shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full w-10 h-10 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-transparent"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="border-white/10 bg-[#1c1c1c] text-white"
            >
              <SheetHeader className="border-b border-white/10">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <Image src="/logo2.png" alt="KinoHarth Logo" width={200} height={60} className="w-auto h-20 object-contain" unoptimized />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="mt-4 border-t border-white/10 pt-4">
                  {futureLinks.map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-white/35"
                    >
                      <span>{label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/45">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" prefetch={false} className="flex items-center group">
            <Image
              src="/logo2.png"
              alt="KinoHarth Logo"
              width={200}
              height={120}
              className="w-[120px] h-auto mt-2 object-contain transition-opacity duration-300 group-hover:opacity-90"
              unoptimized
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    "relative text-sm font-medium transition-colors hover:text-white group py-1 tracking-wide",
                    isActive ? "text-white" : "text-white/60"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-[2px] rounded-full bg-white transition-all duration-300 ease-out",
                      isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-40"
                    )}
                  />
                </Link>
              );
            })}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              {futureLinks.map((label) => (
                <span
                  key={label}
                  className="cursor-not-allowed text-sm font-medium text-white/35"
                >
                  {label}
                </span>
              ))}
            </div>
          </nav>
        </div>

        <form
          action="/search"
          className="flex-1 max-w-sm hidden md:block ml-auto mr-8"
        >
          <div className="relative group">
            <Input
              name="q"
              placeholder="Search anime..."
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-1 focus:ring-white/20 border border-white/5 focus:border-white/20 rounded-full pl-5 pr-10 h-10 text-sm placeholder:text-white/40 text-white transition-all duration-300 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/40 transition-all duration-300 hover:text-white hover:bg-white/10 group-focus-within:text-white/80"
              aria-label="Search anime"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => {
              setMobileSearchPathname(pathname);
              setIsMobileSearchOpen(true);
            }}
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full w-9 h-9 bg-white/5 backdrop-blur-md hover:bg-white/15 text-white border border-white/5 transition-all"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (hasUnread) setHasUnread(false);
              }}
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full w-9 h-9 backdrop-blur-md border border-white/5 transition-all active:scale-95",
                isNotificationsOpen
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"
              )}
              aria-label="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>
            {hasUnread && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#141414] animate-pulse" />
            )}

            {/* Notifications Dropdown Panel */}
            {isNotificationsOpen && (
              <>
                {/* Backdrop overlay for closing */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsNotificationsOpen(false)}
                />
                
                <div className="absolute right-0 mt-3 w-80 bg-[#1c1c1c]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-primary" />
                      Notifications
                    </h4>
                    <button 
                      onClick={() => setHasUnread(false)}
                      className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {/* Item 1: Site Feature Update */}
                    <div className="group/item flex gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-[11px] font-bold text-white/90">Catalog System Live!</p>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                          Explore thousands of anime with advanced multi-filters (Genre, Season, Year, Format).
                        </p>
                        <span className="block text-[9px] text-white/30 pt-0.5">Just now</span>
                      </div>
                    </div>

                    {/* Item 2: Schedule Alert */}
                    <div className="group/item flex gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Tv className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-[11px] font-bold text-white/90">Airing Broadcast Alert</p>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                          Demon Slayer: Hashira Training Arc Episode 4 is now broadcasting live.
                        </p>
                        <span className="block text-[9px] text-white/30 pt-0.5">2 hours ago</span>
                      </div>
                    </div>

                    {/* Item 3: Trending Alert */}
                    <div className="group/item flex gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Flame className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-[11px] font-bold text-white/90">Trending This Week</p>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                          Kaiju No. 8 & Wind Breaker are generating massive hype. Start watching now!
                        </p>
                        <span className="block text-[9px] text-white/30 pt-0.5">1 day ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
