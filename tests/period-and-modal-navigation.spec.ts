import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dateKey } from "../src/lib/format/period";
import {
  selectPeriod,
  selectWeeklyStory,
} from "../src/features/home/select-month";

test.use({ timezoneId: "America/Los_Angeles" });

test("Batas hari WIB dan rentang inklusif pada fixture", () => {
  expect(dateKey("2026-10-31T16:59:59Z")).toBe("2026-10-31");
  expect(dateKey("2026-10-31T17:00:00Z")).toBe("2026-11-01");
  expect(
    selectPeriod({ kind: "range", start: "2026-10-31", end: "2026-11-01" })
      .totalIdr,
  ).toBe("38500");
  const day = selectPeriod({
    kind: "range",
    start: "2026-11-13",
    end: "2026-11-13",
  });
  expect(day.totalIdr).toBe("348000");
  expect(day.count).toBe(2);
  expect(selectWeeklyStory().totalIdr).toBe("1210000");
});

test("Rentang dapat dilanjutkan dengan keyboard dan urutan tanggal terbalik", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/beranda");
  const open = page.getByRole("button", { name: "Pilih periode pengeluaran" });
  const apply = page.getByRole("button", { name: "Terapkan periode" });
  const day = (value: string) =>
    page.locator(
      `.react-datepicker__day--0${value}:not(.react-datepicker__day--outside-month)`,
    );
  await open.click();
  await page
    .getByRole("button", { name: "Rentang tanggal", exact: true })
    .click();
  await page.getByLabel("Tahun rentang").selectOption("2026");
  await page.getByLabel("Bulan rentang").selectOption("10");
  await day("12").click();
  await expect(apply).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(page.locator(".hero-amount")).toHaveText("Rp558.000");
  await open.click();
  await day("13").click();
  await day("10").click();
  await apply.click();
  await expect(page.locator(".hero-amount")).toHaveText("Rp1.110.000");
  await expect(page.locator(".summary-meta")).toContainText(
    "10 Nov 2026 – 13 Nov 2026",
  );
});

for (const theme of ["light", "dark"] as const) {
  test(`Rentang tanggal, satu hari, lintas bulan, dan reset ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/beranda");
    const open = page.getByRole("button", {
      name: "Pilih periode pengeluaran",
    });
    const apply = page.getByRole("button", { name: "Terapkan periode" });
    const day = (value: string) =>
      page.locator(
        `.react-datepicker__day--0${value}:not(.react-datepicker__day--outside-month)`,
      );
    await open.click();
    await page
      .getByRole("button", { name: "Rentang tanggal", exact: true })
      .click();
    await page.getByLabel("Tahun rentang").selectOption("2026");
    await page.getByLabel("Bulan rentang").selectOption("10");
    await expect(apply).toBeDisabled();
    await day("12").click();
    await expect(apply).toBeDisabled();
    await day("13").click();
    await expect(apply).toBeEnabled();
    await expect(apply).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Kembali ke bulan ini" }),
    ).toBeInViewport({ ratio: 1 });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/range-calendar-${theme}.png` });
    await apply.click();
    await expect(page.locator(".hero-amount")).toHaveText("Rp558.000");
    await expect(page.locator(".summary-meta")).toContainText("3 transaksi");
    await expect(page.locator(".floating-category .money")).toHaveText([
      "Rp28.000",
      "Rp320.000",
      "Rp210.000",
      "Rp0",
    ]);
    await expect(open).toBeFocused();
    await open.click();
    await expect(
      page.getByRole("button", { name: "Rentang tanggal", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await day("13").click();
    await day("13").click();
    await apply.click();
    await expect(page.locator(".hero-amount")).toHaveText("Rp348.000");
    await expect(page.locator(".summary-meta")).toContainText("2 transaksi");
    await open.click();
    await page.getByLabel("Bulan rentang").selectOption("9");
    await day("31").click();
    await page
      .getByRole("button", { name: "Bulan berikutnya", exact: true })
      .click();
    await day("01").click();
    await apply.click();
    await expect(page.locator(".hero-amount")).toHaveText("Rp38.500");
    await expect(page.locator(".summary-meta")).toContainText(
      "31 Okt 2026 – 1 Nov 2026",
    );
    await open.click();
    await page.getByRole("button", { name: "Kembali ke bulan ini" }).click();
    await expect(page.locator(".hero-amount")).toHaveText("Rp1.248.500");
    // An incomplete draft dismissed with Escape must not replace the applied period.
    await open.click();
    await page
      .getByRole("button", { name: "Rentang tanggal", exact: true })
      .click();
    await day("12").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".hero-amount")).toHaveText("Rp1.248.500");
  });

  for (const width of [360, 390, 1280]) {
    test(`Kembali seluruh submodal dan detail refined ${width} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/beranda");
      const food = page.getByRole("button", { name: /Makanan Rp580/ });
      await food.click();
      let dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("button", { name: "Kembali", exact: true }),
      ).toHaveCount(0);
      await dialog.getByRole("button", { name: /Kopi Sudut/ }).click();
      await expect(dialog).toHaveAccessibleName("Detail pengeluaran");
      await expect(dialog.locator(".detail-amount")).toHaveText("−Rp28.000");
      await expect(dialog.locator(".receipt-metadata time")).toContainText(
        "13 Nov 2026",
      );
      await expect(dialog.locator(".receipt-metadata time small")).toHaveText(
        "13.45 WIB",
      );
      await expect(dialog).toHaveClass(/dialog-sheet/);
      await expect(dialog.locator(".receipt-status")).toHaveText("Tercatat");
      await expect(
        dialog.getByRole("button", { name: "Ubah detail" }),
      ).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Selesai melihat detail" }),
      ).toBeInViewport({ ratio: 1 });
      for (const part of [
        ".expense-receipt",
        ".receipt-encouragement",
        ".receipt-meta-panel",
      ]) {
        await expect(dialog.locator(part)).toHaveCSS(
          "background-image",
          "none",
        );
      }
      await expect(
        dialog.getByRole("button", { name: "Kembali", exact: true }),
      ).toBeFocused();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/receipt-${width}-${theme}.png`,
      });
      await page.keyboard.press("Enter");
      await expect(dialog).toHaveAccessibleName("Makanan");
      await expect(
        dialog.getByRole("button", { name: /Kopi Sudut/ }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(food).toBeFocused();
      const missions = page
        .locator(".missions-area")
        .getByRole("button", { name: /Lihat semua/ });
      await missions.click();
      await dialog
        .getByRole("button", { name: "Lihat cerita mingguan" })
        .click();
      await expect(dialog).toHaveAccessibleName("Cerita mingguan");
      await expect(dialog.locator(".dialog-demo")).toContainText(
        "7 Nov 2026 – 13 Nov 2026",
      );
      await expect(dialog.locator(".story-summary .money")).toHaveText(
        "Rp1.210.000",
      );
      await expect(dialog.locator(".story-categories > li")).toHaveCount(4);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/weekly-story-${width}-${theme}.png`,
      });
      await dialog
        .getByRole("button", { name: "Kembali", exact: true })
        .click();
      await expect(dialog).toHaveAccessibleName("Misi kamu");
      await expect(
        dialog.getByRole("button", { name: "Lihat cerita mingguan" }),
      ).toBeFocused();
      await expect(dialog).toContainText("Belum direview");
      await page.keyboard.press("Escape");
      await expect(missions).toBeFocused();
      const add = page
        .locator(".expense-summary")
        .getByRole("button", { name: "Catat pengeluaran" });
      await add.click();
      const method = dialog.getByRole("button", {
        name: /Scan struk otomatis/,
      });
      await method.click();
      await expect(dialog).toHaveAccessibleName("Scan struk");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await dialog
        .getByRole("button", { name: "Kembali", exact: true })
        .click();
      await expect(dialog).toHaveAccessibleName("Catat pengeluaran baru");
      await expect(method).toBeFocused();
      await method.click();
      await dialog.getByRole("button", { name: "Tutup dialog" }).click();
      await expect(dialog).toHaveCount(0);
      await expect(add).toBeFocused();
      await expect(page.locator(".xp-pill")).toContainText("340 XP");
      // A new root modal must not inherit history from the previous flow.
      await page
        .locator(".transactions-area")
        .getByRole("button", { name: /Kopi Sudut/ })
        .click();
      dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("button", { name: "Kembali", exact: true }),
      ).toHaveCount(0);
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      await dialog
        .getByRole("button", { name: "Selesai melihat detail" })
        .click();
      await expect(dialog).toHaveCount(0);
      await expect(
        page
          .locator(".transactions-area")
          .getByRole("button", { name: /Kopi Sudut/ }),
      ).toBeFocused();
    });
  }
}
