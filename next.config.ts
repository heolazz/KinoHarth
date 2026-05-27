import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.177', 'localhost'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      }
    ],
  },
};

export default nextConfig;
