import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// For next dev: the injected branch intentionally emits a metadata warning.
// Isolated Chrome pages never change the user's extension settings.
const baseURL = process.env.CASHLY_DEV_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const injected of [false, true]) {
    const page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const warnings = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /hydrat/i.test(message.text()))
        warnings.push(message.text());
    });
    if (injected)
      await page.addInitScript(() => {
        const mark = (root) => {
          if (!(root instanceof Element || root instanceof Document)) return;
          const nodes = [
            ...(root.matches?.("div[hidden]") ? [root] : []),
            ...root.querySelectorAll("div[hidden]"),
          ];
          for (const element of nodes)
            if (!element.hasAttribute("bis_skin_checked"))
              element.setAttribute("bis_skin_checked", "1");
        };
        new MutationObserver((records) => {
          for (const record of records)
            for (const node of record.addedNodes) mark(node);
        }).observe(document, { childList: true, subtree: true });
        mark(document);
      });
    const response = await page.goto(new URL("/beranda", baseURL).href);
    assert.equal(response?.status(), 200);
    assert.equal(
      (await response.text()).includes("bis_skin_checked"),
      false,
      "The server must not contain extension attributes",
    );
    await page
      .locator(".expense-summary")
      .getByRole("button", { name: "Catat pengeluaran", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Catat pengeluaran baru", exact: true }),
    ).toBeVisible();
    const marked = await page.locator("div[hidden][bis_skin_checked]").count();
    if (injected) {
      assert.ok(
        marked > 0,
        "The marker must actually reach the hidden metadata div",
      );
      assert.ok(
        warnings.some(
          (warning) =>
            warning.includes("bis_skin_checked") &&
            /MetadataWrapper|next_metadata_boundary/.test(warning),
        ),
        "The injected branch must reproduce the reported metadata warning",
      );
      console.log(
        "Injected marker: expected MetadataWrapper hydration warning reproduced; application remains interactive.",
      );
    } else {
      assert.equal(marked, 0);
      assert.deepEqual(warnings, []);
      console.log(
        "Clean Chrome: no marker, no hydration warning; application interactive.",
      );
    }
    await page.close();
  }
} finally {
  await browser.close();
}
