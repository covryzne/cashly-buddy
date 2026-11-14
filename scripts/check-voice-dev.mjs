import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.CASHLY_DEV_URL ?? "http://localhost:3000";
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-unsafe-swiftshader", "--use-fake-device-for-media-stream"],
});
try {
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({
      colorScheme,
      reducedMotion: "reduce",
      permissions: ["microphone"],
      viewport: { width: 390, height: 844 },
    });
    await page.goto(new URL("/beranda", baseURL).href);
    await page
      .locator(".expense-summary")
      .getByRole("button", { name: "Catat pengeluaran" })
      .click();
    const sheet = page.getByRole("dialog");
    assert.equal(
      await sheet.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
      true,
    );
    await page.getByRole("button", { name: /Voice note kilat/ }).click();
    const orb = page.locator('[data-slot="fluid-orb"]');
    // next dev replays the effect in Strict Mode; production-only tests missed this.
    await expect(orb).toHaveAttribute("data-renderer", "webgl");
    await expect(orb.locator("canvas")).toBeVisible();
    assert.equal(
      await orb
        .locator("canvas")
        .evaluate((canvas) => canvas.getContext("webgl").isContextLost()),
      false,
    );
    const record = page.getByRole("button", {
      name: "Mulai rekam",
      exact: true,
    });
    const styles = await record.evaluate((node) => ({
      radius: getComputedStyle(node).borderRadius,
      width: node.clientWidth,
      visible: node.getBoundingClientRect().bottom <= innerHeight,
    }));
    assert.equal(styles.radius, "50%");
    assert.ok(styles.width >= 68);
    assert.equal(styles.visible, true);
    assert.equal(await page.locator('[data-slot="fluid-orb"]').count(), 1);
    assert.equal(
      await page
        .locator('[data-slot="fluid-orb"] canvas')
        .evaluate((node) => getComputedStyle(node).width),
      "160px",
    );
    await page.screenshot({ path: `test-results/dev-orb-${colorScheme}.png` });
    for (let repeat = 0; repeat < 3; repeat++) {
      await page.keyboard.press("Escape");
      await page
        .locator(".expense-summary")
        .getByRole("button", { name: "Catat pengeluaran" })
        .click();
      await page.getByRole("button", { name: /Voice note kilat/ }).click();
      await expect(orb).toHaveAttribute("data-renderer", "webgl");
      await expect(orb.locator("canvas")).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Mulai rekam", exact: true })
      .click();
    await expect(page.locator(".voice-timer")).toContainText("00:01");
    await page
      .getByRole("button", { name: "Hentikan rekaman", exact: true })
      .click();
    await expect(page.locator('[data-slot="voice-note"]')).toBeVisible();
    assert.equal(await page.getByRole("textbox").count(), 0);
    await page.getByRole("button", { name: /Tinjau pengeluaran/ }).click();
    await expect(
      page.getByRole("dialog", { name: "Review pengeluaran", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ubah transkrip", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Transkrip voice note")
        .evaluate((node) => getComputedStyle(node).fontSize),
      "16px",
    );
    console.log(
      `${colorScheme}: dev voice OK — CSS, live WebGL, Strict Mode and repeated open/close`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
