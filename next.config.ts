import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind uses postcss.config.mjs; Next handles CSS imports natively.
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
