import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Kartu Mochi satu layar ${viewport.width} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/beranda");
      await expect(page.locator(".companion-card")).toBeVisible();
      const card = await page.locator(".companion-card").boundingBox();
      const nav = await page.locator(".bottom-nav").boundingBox();
      expect(card!.y + card!.height).toBeLessThanOrEqual(nav!.y);
      await expect(
        page
          .locator(".home-theme-control")
          .getByRole("button", { name: /Ganti tema/ }),
      ).toBeVisible();
      await page.screenshot({
        path: `test-results/compact-home-${viewport.width}-${theme}.png`,
      });
    });
  }
}

for (const theme of ["light", "dark"] as const) {
  test(`Library periode dan daftar misi ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/beranda");
    await page
      .getByRole("button", { name: "Pilih periode pengeluaran" })
      .click();
    const calendar = page.locator(".cashly-calendar");
    await expect(calendar).toBeVisible();
    await expect(calendar.locator(".react-datepicker__month-text")).toHaveCount(
      12,
    );
    const dateResult = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(dateResult.violations).toEqual([]);
    await page.screenshot({ path: `test-results/period-library-${theme}.png` });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Pilih periode pengeluaran" }),
    ).toBeFocused();
    await page
      .locator(".missions-area")
      .getByRole("button", { name: /Lihat semua/ })
      .click();
    await expect(page.locator(".mission-detail-list > li")).toHaveCount(2);
    await expect(
      page.getByRole("progressbar", { name: "Progres misi" }),
    ).toHaveAttribute("value", "1");
    await expect(page.getByRole("dialog")).toContainText("Belum direview");
    const missionResult = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(missionResult.violations).toEqual([]);
    await page.screenshot({ path: `test-results/mission-board-${theme}.png` });
    await page.keyboard.press("Escape");
    await expect(page.locator(".xp-pill")).toContainText("340 XP");
  });
}
