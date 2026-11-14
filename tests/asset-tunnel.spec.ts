import { test, expect } from "@playwright/test";

test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

test("Cookie akses tunnel tetap dibawa ketika worker preload dan memuat ulang gambar", async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const cookieName = "cashly-tunnel-access-test";
  await context.addCookies([
    {
      name: cookieName,
      value: "test-only",
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  let denied = 0;
  let authorized = 0;
  await context.route(
    (url) =>
      url.origin === origin &&
      (url.pathname.startsWith("/mascot/") ||
        url.pathname.startsWith("/branding/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname === "/_next/image"),
    async (route) => {
      const cookie = (await route.request().allHeaders()).cookie || "";
      if (!cookie.includes(`${cookieName}=test-only`)) {
        denied++;
        await route.fulfill({
          status: 401,
          body: "Tunnel authentication required",
          contentType: "text/plain",
        });
        return;
      }
      authorized++;
      await route.continue();
    },
  );
  await page.goto("/login");
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        for (const name of await caches.keys()) {
          if (
            name.startsWith("cashly-public-assets-") &&
            (await (
              await caches.open(name)
            ).match("/mascot/mochi-crown-transparent.webp"))
          )
            return true;
        }
        return false;
      }),
    )
    .toBe(true);
  await page.reload();
  for (const selector of [
    ".auth-brand-image",
    ".auth-mascot",
    ".google-sign-in img",
  ]) {
    const image = page.locator(selector);
    await expect(image).toHaveCount(1);
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  expect(authorized).toBeGreaterThan(0);
  expect(denied).toBe(0);
});
