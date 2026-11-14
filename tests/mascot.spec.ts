import { test, expect } from "@playwright/test";

test("Scene Spline asli termuat, canvas berukuran benar, tanpa reward baru", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/beranda");
  await page.locator(".mascot-button").scrollIntoViewIfNeeded();
  await expect(page.locator(".mascot-button")).toHaveAttribute(
    "data-scene-state",
    "ready",
    { timeout: 25000 },
  );
  await expect(page.locator(".spline-mascot canvas")).toBeVisible();
  await expect(page.locator(".spline-mascot canvas")).toHaveJSProperty(
    "width",
    400,
  );
  await expect(page.locator(".spline-mascot canvas")).toHaveJSProperty(
    "height",
    400,
  );
  // Let the first GPU frame finish before hit-testing the visible character.
  await page.waitForTimeout(1000);
  await page.locator(".mascot-button").click();
  await expect(page.locator(".companion-hint")).toContainText("Hai, Nara!");
  await page.waitForTimeout(750);
  await expect(page.locator(".xp-pill")).toContainText("340 XP");
  await expect(
    page.getByRole("heading", { name: /12 hari streak/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/mascot-spline-mobile.png",
    fullPage: true,
  });
  await page.locator(".mascot-button").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".xp-pill")).toContainText("340 XP");
  expect(errors).toEqual([]);
});

test("Scene dimuat langsung walau di bawah fold; tidak menampilkan poster saat loading", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 200 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let requested = false;
  let release: (() => void) | undefined;
  await context.route(
    "https://prod.spline.design/**/scene.splinecode",
    async (route) => {
      requested = true;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.abort();
    },
  );
  try {
    await page.goto("/beranda");
    await expect.poll(() => requested).toBe(true);
    expect(
      await page
        .locator(".mascot-button")
        .evaluate((el) => el.getBoundingClientRect().top > innerHeight),
    ).toBe(true);
    await expect(page.locator(".mascot-button")).toHaveAttribute(
      "data-scene-state",
      "loading",
    );
    await expect(page.locator(".mascot-button img")).toHaveCount(0);
  } finally {
    release?.();
  }
  await expect(page.locator(".mascot-button")).toHaveAttribute(
    "data-scene-state",
    "failed",
  );
  await expect(page.locator(".mascot-button img")).toHaveCount(1);
});

test("Navigasi berulang membersihkan runtime dan tidak menghasilkan console error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (let i = 0; i < 3; i++) {
    await page.goto("/beranda");
    await expect(page.locator(".mascot-button")).toHaveAttribute(
      "data-scene-state",
      "ready",
      { timeout: 25000 },
    );
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Isi data contoh" }),
    ).toBeVisible();
    await expect(page.locator(".spline-runtime")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("Scene gagal diunduh tetap menampilkan poster dan ringkasan", async ({
  page,
  context,
}) => {
  await context.route("https://prod.spline.design/**", (route) =>
    route.abort(),
  );
  await page.goto("/beranda");
  await page.locator(".mascot-button").scrollIntoViewIfNeeded();
  await expect(page.locator(".mascot-button")).toHaveAttribute(
    "data-scene-state",
    "failed",
    { timeout: 25000 },
  );
  await expect(page.locator(".mascot-button img")).toBeVisible();
  await expect(page.locator(".hero-amount")).toHaveText("Rp1.248.500");
});

test("Reduced motion tidak mengunduh scene dan memakai cutout", async ({
  page,
  context,
}) => {
  const sceneRequests: string[] = [];
  context.on("request", (request) => {
    if (request.url().includes("scene.splinecode"))
      sceneRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/beranda");
  await expect(page.locator(".mascot-button img")).toBeVisible();
  await expect(page.locator(".spline-mascot")).toHaveCount(0);
  expect(sceneRequests).toEqual([]);
  await page.goto("/login");
  await expect(page.locator(".auth-mascot")).toHaveAttribute(
    "src",
    /mochi-crown-transparent/,
  );
});

test("Root diarahkan lewat HTTP 307 dan atribut smooth scroll tersedia", async ({
  request,
  page,
}) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/login");
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-behavior",
    "smooth",
  );
});
