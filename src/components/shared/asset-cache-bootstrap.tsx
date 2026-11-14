"use client";

import { useEffect } from "react";
import { prepareAssetCache, preloadLoginAssets } from "@/lib/assets/cache";

export function AssetCacheBootstrap() {
  useEffect(() => {
    void prepareAssetCache();
  }, []);
  return null;
}

export function LoginAssetPreloader() {
  useEffect(() => {
    // Intentionally continues across navigation: Beranda can reuse the download.
    void preloadLoginAssets().catch(() => {
      // Background preparation is optional; never interrupt authentication.
    });
  }, []);
  return null;
}
