import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

// Verify the CSS actually served by next dev, independently of next build.
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
    const styles = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "scan-flow scan-flow-processing";
      probe.style.cssText = "position:fixed;left:-10000px;width:350px;";
      probe.innerHTML =
        '<div class="analysis-toast">Status</div><div class="analysis-panel"><div class="analysis-ring"><svg width="112" height="112"><circle fill="none" cx="42" cy="42" r="38"/></svg><div class="analysis-ring-label"><strong>76%</strong></div></div><ol class="analysis-stages"><li>Step</li></ol></div><div class="asset-loader"><div class="ld-slide" style="--ld-size:48px"></div></div><div class="analysis-actions"><div><button>Manual</button><button>Batal</button></div></div>';
      document.body.append(probe);
      const style = (selector) =>
        getComputedStyle(probe.querySelector(selector));
      const result = {
        background: getComputedStyle(probe).backgroundColor,
        toast: style(".analysis-toast").display,
        radius: style(".analysis-panel").borderRadius,
        panelBackground: style(".analysis-panel").backgroundColor,
        ringWidth: style(".analysis-ring").width,
        ringLabel: style(".analysis-ring-label").display,
        circleFill: style("circle").fill,
        loaderLayout: style(".asset-loader").display,
        slideWidth: style(".ld-slide").width,
        stages: style(".analysis-stages").display,
        actions: style(".analysis-actions > div").display,
      };
      probe.remove();
      return result;
    });
    assert.equal(
      styles.background,
      "rgb(36, 30, 54)",
      "Scanner CSS missing in dev",
    );
    assert.equal(styles.toast, "flex");
    assert.equal(styles.radius, "28px");
    assert.notEqual(styles.panelBackground, "rgba(0, 0, 0, 0)");
    assert.equal(styles.ringWidth, "112px");
    assert.equal(styles.ringLabel, "flex");
    assert.equal(styles.circleFill, "none");
    assert.equal(styles.loaderLayout, "inline-grid");
    assert.equal(styles.slideWidth, "48px");
    assert.equal(styles.stages, "grid");
    assert.equal(styles.actions, "grid");
    console.log(
      `${colorScheme}: dev scan CSS OK — circle percentage, 48px Slide, panel and footer layout`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
