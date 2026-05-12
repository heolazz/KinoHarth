"use client";

import Link from "next/link";
import { Bell, Menu, Search, Tv } from "lucide-react";
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
          ? "bg-[#141414]/80 backdrop-blur-2xl border-b border-white/5 py-3 shadow-2xl"
          : "bg-gradient-to-b from-black/60 to-transparent py-5"
      )}
    >
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
                  KinoHarth
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

          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-xl font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">
              KinoHarth
            </span>
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
            render={<Link href="/search" />}
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full w-9 h-9 bg-white/5 backdrop-blur-md hover:bg-white/15 text-white border border-white/5 transition-all"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </Button>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-white/5 backdrop-blur-md hover:bg-white/15 text-white border border-white/5 transition-all group-hover:scale-105">
              <Bell className="w-4 h-4" />
            </Button>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#141414]" />
          </div>
          
          <Avatar className="w-9 h-9 border-2 border-white/10 ring-2 ring-transparent hover:ring-white/30 hover:border-white/30 transition-all duration-300 cursor-pointer ml-1">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=AnimeBoy&backgroundColor=c0aede" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
