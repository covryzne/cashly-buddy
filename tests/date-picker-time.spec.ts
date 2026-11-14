import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce", timezoneId: "Pacific/Auckland" });
async function openReceipt(page: Page) {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
  await page
    .getByRole("button", { name: "Coba struk contoh", exact: true })
    .click();
}

for (const width of [360, 390, 1280]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Tanggal shadcn dan waktu terkontrol ${width}px ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
      await page.emulateMedia({ colorScheme: theme });
      await openReceipt(page);
      const review = page.getByRole("dialog", {
        name: "Review struk",
        exact: true,
      });
      const trigger = page.getByLabel("Tanggal pengeluaran", { exact: true });
      await expect(trigger).toHaveText("13 Nov 2026");
      await trigger.click();
      const popup = page.getByRole("dialog", {
        name: "Pilih tanggal pengeluaran",
        exact: true,
      });
      await expect(popup).toBeVisible();
      await expect(popup).toHaveCSS("border-top-width", "1px");
      expect(
        await popup.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      ).not.toBe("rgba(0, 0, 0, 0)");
      expect((await popup.boundingBox())!.width).toBeLessThanOrEqual(290);
      expect((await popup.boundingBox())!.height).toBeLessThan(370);
      const fieldBoxes = await page
        .locator(".date-time-picker > [data-slot=field]")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return { left: box.left, top: box.top };
          }),
        );
      expect(fieldBoxes[1].left).toBeGreaterThan(fieldBoxes[0].left);
      expect(fieldBoxes[1].top).toBeCloseTo(fieldBoxes[0].top);
      expect(
        await popup.evaluate((element) =>
          Boolean(element.closest("dialog[open]")),
        ),
      ).toBe(true);
      await expect(popup).toBeInViewport({ ratio: 1 });
      expect(
        await review.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/shadcn-date-time-${width}-${theme}.png`,
      });
      await popup
        .getByLabel("Pilih tahun", { exact: true })
        .selectOption("2028");
      await popup.getByLabel("Pilih bulan", { exact: true }).selectOption("1");
      await popup.getByRole("button", { name: /29 Februari 2028/ }).click();
      await expect(popup).toHaveCount(0);
      await expect(trigger).toHaveText("29 Feb 2028");
      await expect(trigger).toBeFocused();
      await expect(review.locator('input[name="occurredDate"]')).toHaveValue(
        "2028-02-29",
      );
      const time = page.getByLabel("Waktu (WIB)", { exact: true });
      await expect(time).toHaveAttribute("step", "1");
      await time.fill("09:45:30");
      await page.getByRole("button", { name: /Simulasikan simpan/ }).click();
      await expect(
        page.getByRole("dialog", { name: "Konfirmasi demo" }),
      ).toBeVisible();
      await expect(page.locator(".scan-success-date")).toHaveText(
        "29 Feb 2028, 09.45.30 WIB",
      );
      await page.getByRole("button", { name: "Kembali", exact: true }).click();
      await expect(
        page.getByLabel("Tanggal pengeluaran", { exact: true }),
      ).toHaveText("29 Feb 2028");
      await expect(page.getByLabel("Waktu (WIB)", { exact: true })).toHaveValue(
        "09:45:30",
      );
    });
  }
}

test("Escape menutup kalender dulu, keyboard memilih hari dan fokus kembali", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openReceipt(page);
  const review = page.getByRole("dialog", {
    name: "Review struk",
    exact: true,
  });
  const trigger = page.getByLabel("Tanggal pengeluaran", { exact: true });
  await trigger.click();
  let popup = page.getByRole("dialog", {
    name: "Pilih tanggal pengeluaran",
    exact: true,
  });
  await expect(
    popup.getByRole("button", { name: /13 November 2026/ }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(review).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  popup = page.getByRole("dialog", {
    name: "Pilih tanggal pengeluaran",
    exact: true,
  });
  await expect(popup).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toHaveText("14 Nov 2026");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Klik di luar kalender tetap di review; waktu kosong menampilkan validasi", async ({
  page,
}) => {
  await openReceipt(page);
  const trigger = page.getByLabel("Tanggal pengeluaran", { exact: true });
  const time = page.getByLabel("Waktu (WIB)", { exact: true });
  await trigger.click();
  await time.click();
  await expect(
    page.getByRole("dialog", {
      name: "Pilih tanggal pengeluaran",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Review struk", exact: true }),
  ).toBeVisible();
  await time.fill("");
  await page.getByRole("button", { name: /Simulasikan simpan/ }).click();
  await expect(time).toHaveAttribute("aria-invalid", "true");
  await expect(time).toBeFocused();
  await expect(
    page.getByText("Pilih waktu yang valid.", { exact: true }),
  ).toBeVisible();
  await time.fill("23:59");
  await page.getByRole("button", { name: /Simulasikan simpan/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Konfirmasi demo", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scan-success-date")).toContainText("23.59 WIB");
});

async function settlePopup(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let count = 0;
        const frame = () => {
          if (++count < 12) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      }),
  );
}
async function scrollSnapshot(page: Page) {
  return page.evaluate(() => ({
    modal:
      document.querySelector<HTMLDialogElement>("dialog.scan-flow")!.scrollTop,
    page: window.scrollY,
    triggerY: document
      .querySelector(".date-time-trigger")!
      .getBoundingClientRect().y,
  }));
}

for (const profile of [
  { name: "mouse-360", width: 360, height: 800, touch: false },
  { name: "mouse-390", width: 390, height: 844, touch: false },
  { name: "touch-390", width: 390, height: 844, touch: true },
  { name: "mouse-desktop", width: 1280, height: 900, touch: false },
]) {
  test.describe(`Scroll tanggal dengan animasi aktif ${profile.name}`, () => {
    test.use({
      viewport: { width: profile.width, height: profile.height },
      hasTouch: profile.touch,
      isMobile: profile.touch,
      reducedMotion: "no-preference",
    });
    test("buka, pilih dengan keyboard, dan Escape tidak menggeser modal", async ({
      page,
    }) => {
      await page.route("**/scene.splinecode", (route) => route.abort());
      await openReceipt(page);
      const review = page.getByRole("dialog", {
        name: "Review struk",
        exact: true,
      });
      await expect(review).toHaveCSS("animation-name", "cashly-dialog-in");
      await expect(review).toHaveCSS("animation-fill-mode", "backwards");
      await page.waitForFunction(() =>
        document
          .querySelector("dialog.scan-flow")!
          .getAnimations()
          .every((animation) => animation.playState === "finished"),
      );
      await expect(review).toHaveCSS("transform", "none");
      await review.evaluate((element) => {
        element.scrollTop = element.scrollHeight - element.clientHeight;
      });
      const before = await scrollSnapshot(page);
      expect(before.modal).toBeGreaterThan(500);
      const trigger = page.getByLabel("Tanggal pengeluaran", { exact: true });
      await expect(trigger).toBeInViewport({ ratio: 1 });
      for (let attempt = 0; attempt < 3; attempt++) {
        const box = (await trigger.boundingBox())!;
        // Raw pointer input avoids Playwright's automatic scrollIntoView.
        if (profile.touch)
          await page.touchscreen.tap(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
        else
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        const popup = page.getByRole("dialog", {
          name: "Pilih tanggal pengeluaran",
          exact: true,
        });
        await expect(popup).toBeVisible();
        await settlePopup(page);
        const opened = await scrollSnapshot(page);
        expect(opened.modal).toBeCloseTo(before.modal, 0);
        expect(opened.page).toBe(before.page);
        expect(opened.triggerY).toBeCloseTo(before.triggerY, 0);
        if (attempt === 0) {
          await expect(
            popup.getByRole("button", { name: /13 November 2026/ }),
          ).toBeFocused();
          await page.keyboard.press("ArrowRight");
          await page.keyboard.press("Enter");
          await expect(trigger).toHaveText("14 Nov 2026");
        } else await page.keyboard.press("Escape");
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();
        const closed = await scrollSnapshot(page);
        expect(closed.modal).toBeCloseTo(before.modal, 0);
        expect(closed.page).toBe(before.page);
      }
    });
  });
}

test("Fokus kalender tidak menggulung modal yang masih bertransform", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/scene.splinecode", (route) => route.abort());
  await openReceipt(page);
  await page.waitForFunction(() =>
    document
      .querySelector("dialog.scan-flow")!
      .getAnimations()
      .every((animation) => animation.playState === "finished"),
  );
  // Recreate the containing block that also exists while an entry animation runs.
  await page
    .getByRole("dialog", { name: "Review struk", exact: true })
    .evaluate((element) => {
      element.style.transform = "translateY(0)";
      element.scrollTop = element.scrollHeight - element.clientHeight;
    });
  const before = await scrollSnapshot(page);
  const trigger = page.getByLabel("Tanggal pengeluaran", { exact: true });
  const box = (await trigger.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const popup = page.getByRole("dialog", {
    name: "Pilih tanggal pengeluaran",
    exact: true,
  });
  await expect(popup).toBeVisible();
  await settlePopup(page);
  const after = await scrollSnapshot(page);
  expect(after.modal).toBeCloseTo(before.modal, 0);
  expect(after.triggerY).toBeCloseTo(before.triggerY, 0);
  await expect(
    popup.getByRole("button", { name: /13 November 2026/ }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("14 Nov 2026");
  expect((await scrollSnapshot(page)).modal).toBeCloseTo(before.modal, 0);
});
