import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cashly Buddy",
    short_name: "Cashly",
    lang: "id",
    description: "Catat pengeluaran dan bangun kebiasaan baik bersama Cashly.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9fe",
    theme_color: "#faf9fe",
    icons: [
      {
        src: "/icons/icon-192.png?v=mochi-1",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png?v=mochi-1",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png?v=mochi-1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
