import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 430, 768, 1280, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Login ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/login");
      await expect(
        page.getByRole("heading", { name: "Selamat datang kembali!" }),
      ).toBeVisible();
      await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
      await expect(page.getByText("Langkah kecil hari ini")).toBeVisible();
      await expect(page.getByText("Pelan-pelan, bareng Mochi.")).toBeVisible();
      await expect(
        page.getByText("Tanpa menghakimi. Selalu menemani."),
      ).toBeVisible();
      await expect(page.locator(".auth-brand-image")).toBeVisible();
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
        path: `test-results/login-${width}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}

test("Entry, validasi, tampilkan password, dan masuk demo tanpa kirim kredensial", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.url());
  });
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Masuk ke demo" }).click();
  await expect(
    page.getByText("Masukkan alamat email yang valid."),
  ).toBeVisible();
  await expect(page.getByText("Kata sandi minimal 8 karakter.")).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  await page.getByLabel("Email", { exact: true }).fill("someone@example.com");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("wrong-demo-password");
  await page.getByRole("button", { name: "Masuk ke demo" }).click();
  await expect(page.locator(".login-form").getByRole("alert")).toContainText(
    "Gunakan akun contoh",
  );
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await expect(page.locator(".login-form").getByRole("alert")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Tampilkan kata sandi", exact: true })
    .click();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Sembunyikan kata sandi", exact: true })
    .click();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Masuk ke demo" }).click();
  await expect(page).toHaveURL(/\/beranda$/);
  await expect(page.getByRole("heading", { name: "Hi, Nara!" })).toBeVisible();
  expect(mutations).toEqual([]);
  expect(
    await page.evaluate(() => ({
      cookies: document.cookie,
      session: Object.keys(sessionStorage),
      local: Object.keys(localStorage),
    })),
  ).toEqual({ cookies: "", session: [], local: [] });
  await page
    .getByRole("link", { name: "Beranda", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/beranda$/);
});

test("Navigasi pemulihan dan pendaftaran, tema konsisten", async ({ page }) => {
  await page.goto("/login");
  const forgot = page.getByRole("link", { name: "Lupa kata sandi?" });
  await forgot.click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(
    page.getByRole("heading", { name: "Lupa kata sandi?", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Kembali ke masuk", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("link", { name: "Buat akun", exact: true }),
  ).toHaveAttribute("href", "/register");
  await page.getByRole("button", { name: /Ganti tema/ }).click();
  await page.getByRole("button", { name: /Ganti tema/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await page.getByRole("button", { name: "Masuk ke demo" }).click();
  await expect(page).toHaveURL(/\/beranda$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
