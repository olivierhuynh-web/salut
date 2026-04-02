import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'randomuser.me' },
    ],
  },
};

export default nextConfig;
