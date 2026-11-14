import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

// Check the actual dev CSS entry separately from next build's CSS bundle.
// Offscreen probes do not change app state and are removed immediately.
const baseURL = process.env.CASHLY_DEV_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({
      colorScheme,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const response = await page.goto(new URL("/beranda", baseURL).href);
    assert.equal(
      response?.status(),
      200,
      "Dev server must compile before checking CSS",
    );
    const values = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;left:-10000px;width:320px;";
      probe.innerHTML =
        '<div class="cashly-popover-positioner"><div class="cashly-popover-content date-time-popover"><div class="cashly-calendar-ui rdp-root">Calendar</div></div></div><div class="cashly-field-group date-time-picker"><div class="cashly-field">Date</div><div class="cashly-field">Time</div></div>';
      document.body.append(probe);
      const popup = probe.querySelector(".cashly-popover-content");
      const fields = probe.querySelector(".date-time-picker");
      const calendar = probe.querySelector(".cashly-calendar-ui");
      const [date, time] = fields.children;
      const values = {
        background: getComputedStyle(popup).backgroundColor,
        border: getComputedStyle(popup).borderTopWidth,
        display: getComputedStyle(fields).display,
        calendarWidth: getComputedStyle(calendar).width,
        sideBySide:
          time.getBoundingClientRect().left >
            date.getBoundingClientRect().left &&
          Math.abs(
            time.getBoundingClientRect().top - date.getBoundingClientRect().top,
          ) < 1,
      };
      probe.remove();
      return values;
    });
    assert.notEqual(
      values.background,
      "rgba(0, 0, 0, 0)",
      `${colorScheme}: popup stylesheet missing`,
    );
    assert.equal(values.border, "1px");
    assert.equal(values.display, "grid");
    assert.equal(values.calendarWidth, "276px");
    assert.equal(values.sideBySide, true);
    process.stdout.write(`${colorScheme}: dev date/time CSS OK\n`);
    await page.close();
  }
} finally {
  await browser.close();
}
