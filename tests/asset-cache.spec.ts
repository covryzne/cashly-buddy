import { test, expect, type Page } from "@playwright/test";

const scene = "https://prod.spline.design/R4tRoaLYG0dA8fQD/scene.splinecode";
let sceneBytes: Buffer;
const sceneHeaders = { "access-control-allow-origin": "*" };
test.use({ reducedMotion: "no-preference" });

test.beforeAll(async ({ request }) => {
  const response = await request.get(scene);
  expect(response.ok()).toBe(true);
  sceneBytes = await response.body();
});

async function cachedUrls(page: Page) {
  return page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) =>
      name.startsWith("cashly-public-assets-"),
    );
    const lists = await Promise.all(
      names.map(async (name) =>
        (await (await caches.open(name)).keys()).map((entry) => entry.url),
      ),
    );
    return lists.flat();
  });
}

async function expectReady(page: Page) {
  await expect(page.locator(".mascot-button")).toHaveAttribute(
    "data-scene-state",
    "ready",
    { timeout: 25000 },
  );
}

test("Login tetap interaktif; preload dibagi dengan Beranda dan dipakai lagi setelah reload", async ({
  page,
  context,
}) => {
  let downloads = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.route(scene, async (route) => {
    downloads++;
    await gate;
    await route.fulfill({
      body: sceneBytes,
      contentType: "application/octet-stream",
      headers: sceneHeaders,
    });
  });
  try {
    await page.goto("/login");
    await expect(page.getByLabel("Email", { exact: true })).toBeEditable();
    await expect.poll(() => downloads).toBe(1);
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Isi data contoh" }).click();
    await page.getByRole("button", { name: "Masuk ke demo" }).click();
    await expect(page).toHaveURL(/\/beranda$/);
    await expect(page.locator(".mascot-loading")).toBeVisible();
  } finally {
    release();
  }
  await expectReady(page);
  expect(downloads).toBe(1);
  await expect.poll(() => cachedUrls(page)).toContain(scene);
  await page.reload();
  await expectReady(page);
  expect(downloads).toBe(1);
  await expect(page.locator(".xp-pill")).toContainText("340 XP");
});

test("Scene tersimpan bisa dimuat ulang saat offline dan scene aktif tidak dimatikan", async ({
  page,
  context,
}) => {
  let downloads = 0;
  await context.route(scene, (route) => {
    downloads++;
    return route.fulfill({
      body: sceneBytes,
      contentType: "application/octet-stream",
      headers: sceneHeaders,
    });
  });
  await page.goto("/beranda");
  await expectReady(page);
  await context.setOffline(true);
  await expect(page.getByRole("status")).toContainText("offline");
  await expectReady(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".spline-runtime")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expectReady(page);
  expect(downloads).toBe(1);
});

test("Aktivasi membuang versi lama saja, tanpa mengganggu cache lain atau menyimpan halaman", async ({
  page,
  request,
}) => {
  const workerScript = await request.get("/asset-worker.js");
  expect(workerScript.headers()["cache-control"]).toContain("no-store");
  expect(workerScript.headers()["service-worker-allowed"]).toBe("/");
  expect(
    (
      await request.get(
        "/assets/cashly_beranda_varian_b_floating_cards/screen.png",
      )
    ).status(),
  ).toBe(404);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/manifest.webmanifest");
  await page.evaluate(async () => {
    await (
      await caches.open("cashly-public-assets-v0")
    ).put("/old-image.png", new Response("old"));
    await (
      await caches.open("another-feature-cache")
    ).put("/keep.png", new Response("keep"));
  });
  await page.goto("/login");
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
    )
    .toContain("/asset-worker.js");
  const names = await page.evaluate(() => caches.keys());
  expect(names).not.toContain("cashly-public-assets-v0");
  expect(names).toContain("another-feature-cache");
  await expect
    .poll(() => cachedUrls(page))
    .toContainEqual(expect.stringContaining("/icons/icon-192.png"));
  for (const value of await cachedUrls(page)) {
    const url = new URL(value);
    expect(url.pathname).not.toMatch(/^\/(login|register|beranda|api)(\/|$)/);
  }
});

test("Gambar login hasil optimasi Next dipakai dari cache pada pembukaan berikutnya", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let networkImages = 0;
  context.on("request", (request) => {
    if (
      request.serviceWorker() &&
      new URL(request.url()).pathname === "/_next/image"
    )
      networkImages++;
  });
  await page.goto("/login");
  const images = await page
    .locator(".auth-story img, .auth-brand-image")
    .evaluateAll((elements) =>
      elements.map((element) => (element as HTMLImageElement).currentSrc),
    );
  await expect
    .poll(async () => {
      const urls = await cachedUrls(page);
      return images.every((url) => urls.includes(url));
    })
    .toBe(true);
  const beforeReload = networkImages;
  await page.reload();
  for (const image of await page
    .locator(".auth-story img, .auth-brand-image")
    .all()) {
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  expect(networkImages).toBe(beforeReload);
});

for (const mode of ["reduced-motion", "save-data"] as const) {
  test(`${mode} melewati preload scene besar, gambar publik tetap disiapkan`, async ({
    page,
    context,
  }) => {
    let downloads = 0;
    context.on("request", (request) => {
      if (request.url() === scene) downloads++;
    });
    if (mode === "reduced-motion")
      await page.emulateMedia({ reducedMotion: "reduce" });
    else
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: { saveData: true },
        });
      });
    await page.goto("/login");
    await expect
      .poll(() => cachedUrls(page))
      .toContainEqual(expect.stringContaining("/icons/icon-192.png"));
    expect(downloads).toBe(0);
    expect(await cachedUrls(page)).not.toContain(scene);
    await expect(page.getByLabel("Email", { exact: true })).toBeEditable();
  });
}

test("Gagal preload tidak menahan login atau menyimpan error; Beranda menyediakan fallback", async ({
  page,
  context,
}) => {
  let downloads = 0;
  await context.route(scene, (route) => {
    downloads++;
    return route.abort();
  });
  await page.goto("/login");
  await expect.poll(() => downloads).toBe(1);
  await expect(
    page.getByRole("button", { name: "Isi data contoh" }),
  ).toBeEnabled();
  await page.goto("/beranda");
  await expect(page.locator(".mascot-button")).toHaveAttribute(
    "data-scene-state",
    "failed",
  );
  await expect(page.locator(".mascot-button img")).toBeVisible();
  expect(await cachedUrls(page)).not.toContain(scene);
});

test("Registrasi worker ditolak tetap bisa login dan memuat scene langsung", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    navigator.serviceWorker.register = () =>
      Promise.reject(new DOMException("Blocked", "SecurityError"));
  });
  await context.route(scene, (route) =>
    route.fulfill({
      body: sceneBytes,
      contentType: "application/octet-stream",
      headers: sceneHeaders,
    }),
  );
  await page.goto("/login");
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await page.getByRole("button", { name: "Masuk ke demo" }).click();
  await expectReady(page);
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller),
  ).toBeNull();
});
