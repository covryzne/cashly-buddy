import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 1280]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Panel Catat ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/beranda");
      await expect(page.locator(".topbar")).toHaveCount(0);
      await expect(
        page
          .locator(".home-theme-control")
          .getByRole("button", { name: /Ganti tema/ }),
      ).toBeVisible();
      await expect(page.locator(".mascot-level-copy")).toHaveText(
        "Mochi kamu masih level 1 nih",
      );
      await page
        .locator(".expense-summary")
        .getByRole("button", { name: "Catat pengeluaran" })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Catat pengeluaran baru",
      });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".speed-pod-scan")).toHaveCSS(
        "background-image",
        "none",
      );
      await expect(
        dialog.getByRole("button", { name: /Scan struk otomatis/ }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /Voice note kilat/ }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /Input manual lengkap/ }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/quick-add-${width}-${theme}.png`,
        fullPage: true,
      });
      await dialog.getByRole("button", { name: "Batal" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page
          .locator(".expense-summary")
          .getByRole("button", { name: "Catat pengeluaran" }),
      ).toBeFocused();
    });
  }
}

test("Periode default bulan ini, filter konsisten, dan reset", async ({
  page,
}) => {
  await page.goto("/beranda");
  await page.getByRole("button", { name: "Pilih periode pengeluaran" }).click();
  await page.getByLabel("Tahun pengeluaran").selectOption("2026");
  await page
    .locator(".react-datepicker__month-text")
    .filter({ hasText: /^Okt$/ })
    .click();
  await page.getByRole("button", { name: "Terapkan periode" }).click();
  await expect(page.locator(".hero-amount")).toHaveText("Rp0");
  await expect(page.locator(".summary-meta")).toContainText("0 transaksi");
  await expect(page.locator(".transactions-area")).toContainText(
    "Belum ada pengeluaran",
  );
  await expect(page.locator(".floating-category .money")).toHaveText([
    "Rp0",
    "Rp0",
    "Rp0",
    "Rp0",
  ]);
  await page.getByRole("button", { name: "Pilih periode pengeluaran" }).click();
  await page.getByRole("button", { name: "Kembali ke bulan ini" }).click();
  await expect(page.locator(".hero-amount")).toHaveText("Rp1.248.500");
  await expect(page.locator(".summary-meta")).toContainText("6 transaksi");
});

test("Ketiga pemicu Catat membuka panel dan pilihan metode tidak memberi reward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/beranda");
  await page.locator(".quick-add").click();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Izinkan Akses Kamera");
  await page.keyboard.press("Escape");
  await expect(page.locator(".xp-pill")).toContainText("340 XP");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Catat pengeluaran baru" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
