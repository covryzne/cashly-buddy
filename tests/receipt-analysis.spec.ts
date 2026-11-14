import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce" });

async function openAnalysis(page: Page, freezeClock = true) {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
  if (freezeClock) {
    await page.clock.install({ time: new Date("2026-11-13T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-13T12:00:01Z"));
  }
  await page
    .getByRole("button", { name: "Coba struk contoh", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Analisis struk", exact: true }),
  ).toBeVisible();
}

for (const width of [360, 390, 1280]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Loading struk ${width}px ${theme}: progres simulasi lalu review dummy`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await openAnalysis(page);
      const progress = page.getByRole("progressbar", {
        name: "Progres analisis struk",
      });
      await expect(progress).toHaveAttribute("aria-valuenow", "16");
      await expect(
        page.getByRole("heading", {
          name: "Sedang menganalisis struk kamu, tunggu ya!",
        }),
      ).toBeVisible();
      await page.clock.runFor(1250);
      await expect(progress).toHaveAttribute("aria-valuenow", "76");
      await expect(page.locator(".analysis-ring-label strong")).toHaveText(
        "76%",
      );
      await expect(page.locator(".analysis-ring-label")).toHaveText("76%");
      await expect(progress).toHaveCSS(
        "width",
        width === 390 ? "112px" : "100px",
      );
      await expect(page.locator(".analysis-linear")).toHaveCount(0);
      await expect(page.locator(".morphing-square")).toHaveCount(0);
      await expect(
        page.locator(".analysis-ring svg circle[fill='none']"),
      ).toHaveCount(2);
      await expect(page.locator(".analysis-stages > li")).toHaveCount(4);
      await expect(
        page.getByRole("button", { name: "Ketik manual saja" }),
      ).toBeInViewport({ ratio: 1 });
      await expect(
        page.getByRole("button", { name: "Batal", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      const lastStage = await page
        .locator(".analysis-stages > li")
        .last()
        .boundingBox();
      const footer = await page
        .locator(".scan-flow .dialog-footer")
        .boundingBox();
      expect(lastStage!.y + lastStage!.height).toBeLessThanOrEqual(footer!.y);
      expect(
        await page.evaluate(
          () => document.querySelector(".scan-flow")!.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/receipt-analysis-${width}-${theme}.png`,
      });
      await page.clock.runFor(1300);
      await expect(
        page.getByRole("dialog", { name: "Review struk", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".scan-items > li")).toHaveCount(4);
      await expect(page.locator(".scan-review-total .money")).toHaveText(
        "Rp47.500",
      );
    });
  }
}

test("Input manual menghentikan timer dan tidak diisi dummy belakangan", async ({
  page,
}) => {
  await openAnalysis(page);
  await page.getByRole("button", { name: "Ketik manual saja" }).click();
  const merchant = page.getByLabel("Merchant (opsional)");
  await expect(merchant).toHaveValue("");
  await expect(page.locator(".scan-photo-summary")).toContainText(
    "Input manual",
  );
  await merchant.fill("Toko manual");
  await page.clock.runFor(5000);
  await expect(merchant).toHaveValue("Toko manual");
  await expect(page.locator(".scan-items > li")).toHaveCount(1);
});

for (const action of ["Batal", "Kembali", "Escape"] as const) {
  test(`${action} menghentikan analisis tanpa callback membuka review`, async ({
    page,
  }) => {
    await openAnalysis(page);
    if (action === "Escape") await page.keyboard.press("Escape");
    else await page.getByRole("button", { name: action, exact: true }).click();
    await page.clock.runFor(5000);
    await expect(
      page.getByRole("dialog", { name: "Review struk", exact: true }),
    ).toHaveCount(0);
    if (action === "Escape")
      await expect(page.getByRole("dialog")).toHaveCount(0);
    else
      await expect(
        page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
      ).toBeVisible();
  });
}

test("Loading aksesibel sebelum otomatis membuka review", async ({ page }) => {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
  await page
    .getByRole("button", { name: "Coba struk contoh", exact: true })
    .click();
  const result = await new AxeBuilder({ page })
    .include(".scan-flow-processing")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test.describe("Slide untuk memuat aset", () => {
  test.use({ reducedMotion: "no-preference" });
  test("Slide asli tampil pada scene dan kamera, menghormati reduced motion", async ({
    page,
  }) => {
    await page.route("**/scene.splinecode", () => {});
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        new Promise<MediaStream>(() => {});
    });
    await page.goto("/beranda");
    const mascotLoader = page.locator(".mascot-loading .ld-slide");
    await expect(mascotLoader).toBeVisible();
    await expect(mascotLoader).toHaveCSS("width", "28px");
    await expect(mascotLoader.locator(".ld-slide-dot")).toHaveCount(3);
    await page
      .locator(".expense-summary")
      .getByRole("button", { name: "Catat pengeluaran" })
      .click();
    await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
    await page
      .getByRole("button", { name: "Izinkan kamera", exact: true })
      .click();
    const loader = page.locator(".scan-camera-placeholder .ld-slide");
    await expect(loader).toBeVisible();
    await expect(loader).toHaveCSS("width", "48px");
    const dot = loader.locator(".ld-slide-dot").first();
    const first = await dot.evaluate(
      (element) => getComputedStyle(element).transform,
    );
    await expect
      .poll(
        () => dot.evaluate((element) => getComputedStyle(element).transform),
        { timeout: 2000 },
      )
      .not.toEqual(first);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(dot).toHaveCSS("animation-name", "none");
  });
});
