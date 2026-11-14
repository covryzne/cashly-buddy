import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.CASHLY_DEV_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({
      colorScheme,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    await page.goto(new URL("/beranda", baseURL).href);
    await page
      .locator(".expense-summary")
      .getByRole("button", { name: "Catat pengeluaran" })
      .click();
    await page.getByRole("button", { name: /Chat manual/ }).click();
    const styles = await page
      .locator(".expense-chat-flow")
      .evaluate((dialog) => {
        const input = dialog.querySelector("textarea");
        const group = dialog.querySelector('[data-slot="input-group"]');
        const send = dialog.querySelector('[aria-label="Kirim catatan"]');
        const rect = send.getBoundingClientRect();
        return {
          display: getComputedStyle(dialog).display,
          direction: getComputedStyle(dialog).flexDirection,
          fontSize: getComputedStyle(input).fontSize,
          radius: getComputedStyle(group).borderRadius,
          opacity: getComputedStyle(group).opacity,
          sendVisible: rect.bottom <= window.innerHeight && rect.top >= 0,
        };
      });
    assert.equal(styles.display, "flex");
    assert.equal(styles.direction, "column");
    assert.equal(styles.fontSize, "16px");
    assert.equal(styles.radius, "22px");
    assert.equal(
      styles.opacity,
      "1",
      "Disabled send must not dim the entire composer",
    );
    assert.equal(styles.sendVisible, true);
    console.log(
      `${colorScheme}: dev chat CSS OK — composer, input and send button`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
