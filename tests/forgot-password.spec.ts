import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 430, 768, 1280, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Lupa kata sandi ${width}px ${theme}: layout dan aksesibilitas`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/forgot-password");
      await expect(
        page.getByRole("heading", { name: "Lupa kata sandi?", exact: true }),
      ).toBeVisible();
      await expect(
        page
          .locator(".forgot-password-form")
          .getByLabel("Email", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Langkah kecil hari ini")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/forgot-password-${width}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}

test("Pemulihan memvalidasi email, membersihkan input dan kembali tanpa mengirim email", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.url());
  });
  await page.goto("/login");
  await page
    .getByRole("link", { name: "Lupa kata sandi?", exact: true })
    .click();
  const form = page.locator(".forgot-password-form");
  const email = form.getByLabel("Email", { exact: true });
  await page.getByRole("button", { name: "Simulasikan kirim tautan" }).click();
  await expect(email).toBeFocused();
  await expect(
    page.getByText("Masukkan alamat email yang valid."),
  ).toBeVisible();
  await email.fill("bukan-email");
  await page.getByRole("button", { name: "Simulasikan kirim tautan" }).click();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "Simulasikan kirim tautan" }).click();
  await expect(
    page.getByRole("heading", { name: "Form pemulihan sudah siap." }),
  ).toBeFocused();
  await expect(
    page.getByText(
      "Email pemulihan belum dikirim dan kata sandi belum diubah.",
      { exact: false },
    ),
  ).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("button", { name: "Gunakan email lain" }).click();
  await expect(email).toHaveValue("");
  await expect(email).toBeFocused();
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await page.getByRole("button", { name: "Simulasikan kirim tautan" }).click();
  await page
    .getByRole("link", { name: "Kembali ke masuk", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  expect(mutations).toEqual([]);
  expect(
    await page.evaluate(() => ({
      cookies: document.cookie,
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    })),
  ).toEqual({ cookies: "", local: [], session: [] });
});
