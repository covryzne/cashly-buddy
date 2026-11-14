import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.CASHLY_DEV_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({
      colorScheme,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const hydrationErrors = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydrat|server rendered|server-rendered/i.test(message.text())
      )
        hydrationErrors.push(message.text());
    });
    page.on("pageerror", (error) => hydrationErrors.push(error.message));
    const response = await page.goto(new URL("/login", baseURL).href);
    assert.equal(response?.status(), 200);
    assert.equal(
      (await response.text()).includes("bis_skin_checked"),
      false,
      "Server must not emit extension attributes",
    );
    await page
      .getByRole("heading", { name: "Selamat datang kembali!" })
      .waitFor();
    assert.equal(await page.locator("[bis_skin_checked]").count(), 0);
    await page
      .getByRole("button", { name: "Isi data contoh", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Tampilkan kata sandi", exact: true })
      .click();
    await expect(
      page.getByLabel("Kata sandi", { exact: true }),
    ).toHaveAttribute("type", "text");
    await page
      .getByRole("button", { name: "Masuk ke demo", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Hi, Nara!" }),
    ).toBeVisible();
    assert.deepEqual(
      hydrationErrors,
      [],
      "Clean Chrome must hydrate auth and navigation without warnings",
    );
    console.log(
      `${colorScheme}: clean Chrome dev auth hydration OK — server HTML, form and navigation`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
