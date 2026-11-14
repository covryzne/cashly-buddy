import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 430, 768, 1280, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Beranda ${width}px ${theme}: layout, data, aksesibilitas`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/beranda");
      await expect(
        page.getByRole("heading", { name: "Hi, Nara!" }),
      ).toBeVisible();
      await expect(page.locator(".hero-amount")).toHaveText("Rp1.248.500");
      await expect(page.locator(".mascot-button img")).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator(".mascot-button img")
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(
        page.locator(width >= 1024 ? ".sidebar" : ".bottom-nav"),
      ).toBeVisible();
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/home-${width}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}

test("Detail, keyboard, tema, dan interaksi tidak memberi reward", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/beranda");
  await page.getByRole("button", { name: /Makanan Rp580/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").locator(".category-total"),
  ).toContainText("Rp580.000");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Makanan Rp580/ }),
  ).toBeFocused();
  await page.getByRole("button", { name: /Kopi Sudut/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Kopi dan makan siang");
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await page.getByRole("button", { name: /Sapa Mochi/ }).click();
  await expect(page.locator(".companion-hint")).toContainText("Hai, Nara!");
  await expect(page.locator(".xp-pill")).toContainText("340 XP");
  await expect(
    page.getByRole("heading", { name: /12 hari streak/ }),
  ).toBeVisible();
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Pilih cara input yang paling praktis untukmu",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Ganti tema/ }).click();
  await page.getByRole("button", { name: /Ganti tema/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await context.setOffline(true);
  await expect(page.getByRole("status")).toContainText("offline");
  await context.setOffline(false);
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("Manifest dan ikon PWA tersedia", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) {
    const asset = await request.get(icon.src);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()["content-type"]).toContain("image/png");
  }
});
