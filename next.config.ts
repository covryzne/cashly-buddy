import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind uses postcss.config.mjs; Next handles CSS imports natively.
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/asset-worker.js",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
