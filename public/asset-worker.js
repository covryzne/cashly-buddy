/* Public assets only. Bump VERSION whenever a listed file or Spline export changes,
   even when its URL stays the same. Keep SCENE in sync with spline-mascot.tsx. */
const VERSION = "v1";
const PREFIX = "cashly-public-assets-";
const CACHE = `${PREFIX}${VERSION}`;
const SCENE = "https://prod.spline.design/R4tRoaLYG0dA8fQD/scene.splinecode";
const ASSETS = [
  "/mascot/mochi-crown-transparent.webp",
  "/branding/cashly-header.webp",
  "/branding/google-g.png",
  "/icons/icon-192.png?v=mochi-1",
  "/icons/icon-512.png?v=mochi-1",
  "/icons/icon-maskable-512.png?v=mochi-1",
  "/icons/favicon-16.png?v=mochi-1",
  "/icons/favicon-32.png?v=mochi-1",
  "/apple-touch-icon.png?v=mochi-2",
  "/favicon.ico?v=mochi-1",
];
const paths = new Set(
  ASSETS.map((asset) => new URL(asset, self.location.origin).pathname),
);
const pending = new Map();

function publicImage(url) {
  return (
    url.origin === self.location.origin &&
    paths.has(url.pathname) &&
    [...url.searchParams.keys()].every((key) => key === "v")
  );
}

function allowed(url) {
  if (url.href === SCENE || publicImage(url)) return true;
  if (url.origin !== self.location.origin || url.pathname !== "/_next/image")
    return false;
  const source = url.searchParams.get("url");
  return (
    source?.startsWith("/") &&
    publicImage(new URL(source, self.location.origin)) &&
    [...url.searchParams.keys()].every((key) => ["url", "w", "q"].includes(key))
  );
}

function usable(response) {
  const type = response.headers.get("content-type") || "";
  return (
    response.status === 200 &&
    !response.redirected &&
    (type.startsWith("image/") ||
      type.startsWith("application/json") ||
      type.startsWith("application/octet-stream"))
  );
}

async function assetResponse(request) {
  let cache;
  try {
    cache = await caches.open(CACHE);
    // Warmup fetch and <img> send different Accept headers. These allowlisted
    // WebP/PNG images are displayable in either representation; their URL already
    // includes source, width and quality. Avoid alternating Vary: Accept misses.
    const stored = await cache.match(request, {
      ignoreVary: new URL(request.url).pathname === "/_next/image",
    });
    if (stored && usable(stored)) return stored;
    if (stored) await cache.delete(request);
  } catch {
    // Private browsing, quota, or unavailable storage must not block the UI.
  }
  let download = pending.get(request.url);
  if (!download) {
    download = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(request, {
          credentials: "omit",
          cache: "no-cache",
          signal: controller.signal,
        });
        if (cache && usable(response)) {
          try {
            await cache.put(request, response.clone());
            const entries = await cache.keys();
            // Bound optimized image variants while retaining the large scene.
            const removable = entries.filter((entry) => entry.url !== SCENE);
            await Promise.all(
              removable
                .slice(0, Math.max(0, entries.length - 64))
                .map((entry) => cache.delete(entry)),
            );
          } catch {
            // Still serve a successful download when caching fails.
          }
        }
        return response;
      } finally {
        clearTimeout(timeout);
        pending.delete(request.url);
      }
    })();
    pending.set(request.url, download);
  }
  return (await download).clone();
}

self.addEventListener("install", (event) => {
  // Safe to activate immediately: this worker never caches page code or data.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys().catch(() => []);
      await Promise.allSettled(
        names
          .filter((name) => name.startsWith(PREFIX) && name !== CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    request.mode === "navigate" ||
    request.headers.has("authorization") ||
    !allowed(new URL(request.url))
  )
    return;
  event.respondWith(assetResponse(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "WARM_PUBLIC_ASSETS") return;
  const images = Array.isArray(event.data.images)
    ? event.data.images.slice(0, 16)
    : [];
  const urls = [...ASSETS, ...images];
  if (event.data.includeScene === true) urls.push(SCENE);
  event.waitUntil(
    Promise.allSettled(
      [...new Set(urls)].flatMap((value) => {
        if (typeof value !== "string") return [];
        try {
          const url = new URL(value, self.location.origin);
          return allowed(url)
            ? [
                assetResponse(
                  new Request(url, { mode: "cors", credentials: "omit" }),
                ),
              ]
            : [];
        } catch {
          return [];
        }
      }),
    ),
  );
});
