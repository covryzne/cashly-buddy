import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.CASHLY_DEV_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });

async function injectAutofill(page, probe = false, savedTheme = null) {
  await page.addInitScript(
    ({ probe, savedTheme }) => {
      if (savedTheme) localStorage.setItem("cashly-theme", savedTheme);
      let nextId = 0;
      const inject = (root) => {
        if (!(root instanceof Element || root instanceof Document)) return;
        const selector = "form,input,textarea,select";
        const controls = [
          ...(root.matches?.(selector) ? [root] : []),
          ...root.querySelectorAll(selector),
        ];
        for (const element of controls) {
          if (!element.hasAttribute("__gcruniqueid"))
            element.setAttribute("__gCrUniqueID", String(++nextId));
        }
        if (probe) {
          const wrappers = [
            ...(root.matches?.(".input-wrap") ? [root] : []),
            ...root.querySelectorAll(".input-wrap"),
          ];
          for (const wrapper of wrappers)
            wrapper.setAttribute(
              "data-hydration-probe",
              "intentional-test-only",
            );
        }
      };
      // documentElement may not exist when the init script runs. Observe document.
      new MutationObserver((records) => {
        for (const record of records)
          for (const added of record.addedNodes) inject(added);
      }).observe(document, { childList: true, subtree: true });
      inject(document);
    },
    { probe, savedTheme },
  );
}
async function check(profile, route, negative = false) {
  const page = await browser.newPage({
    viewport: { width: profile.mobile ? 390 : 1280, height: 844 },
    isMobile: profile.mobile,
    hasTouch: profile.mobile,
    locale: profile.mobile ? "id-ID" : "en-US",
    timezoneId: profile.mobile ? "Asia/Jakarta" : "UTC",
    colorScheme: profile.theme,
    reducedMotion: "reduce",
  });
  const warnings = [];
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text()))
      warnings.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await injectAutofill(
    page,
    negative,
    profile.theme === "dark" ? "dark" : null,
  );
  const response = await page.goto(new URL(route, baseURL).href);
  assert.equal(response?.status(), 200);
  assert.equal(
    /<(?:form|input)[^>]*\s__gcruniqueid=/i.test(await response.text()),
    false,
    "IDs belong to the browser, never SSR HTML",
  );
  const input = page.locator("input").first();
  await input.fill("cek@example.com");
  await expect(input).toHaveValue("cek@example.com");
  await input.press("Tab");
  assert.ok(
    (await page.locator("form[__gcruniqueid]").count()) > 0,
    "The injector must actually tag the form before judging warnings",
  );
  assert.ok(
    (await page.locator("input[__gcruniqueid]").count()) > 0,
    "The injector must actually tag the inputs",
  );
  if (negative) {
    assert.ok(
      warnings.some((warning) => warning.includes("data-hydration-probe")),
      "A mismatch on the surrounding wrapper must still produce a warning",
    );
    console.log(
      "negative control OK — an intentional wrapper mismatch is still reported",
    );
  } else {
    assert.deepEqual(
      warnings.map((warning) => warning.slice(0, 1600)),
      [],
      "Autofill IDs must not trigger hydration warnings",
    );
    assert.deepEqual(errors, []);
    console.log(
      `${profile.name} ${route}: pre-hydration autofill IDs preserved, no hydration warnings`,
    );
  }
  await page.close();
}
try {
  const profiles = [
    { name: "desktop-en-UTC", mobile: false, theme: "light" },
    { name: "mobile-touch-id-WIB", mobile: true, theme: "light" },
    { name: "mobile-touch-saved-dark", mobile: true, theme: "dark" },
  ];
  for (const profile of profiles)
    for (const route of ["/login", "/register", "/forgot-password"])
      await check(profile, route);
  await check(profiles[1], "/login", true);
} finally {
  await browser.close();
}
