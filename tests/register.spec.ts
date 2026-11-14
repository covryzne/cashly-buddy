import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 430, 768, 1280, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Register ${width}px ${theme}: responsive, cerita Mochi dan aksesibilitas`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/register");
      await expect(
        page.getByRole("heading", { name: "Kenalan dulu, yuk!" }),
      ).toBeVisible();
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
        path: `test-results/register-${width}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}

test("Form pendaftaran memvalidasi, menghapus data dan membuka demo tanpa membuat akun", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.url());
  });
  await page.goto("/login");
  await page.getByRole("link", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  // Next keeps the previous route hidden in its navigation cache.
  const form = page.locator(".register-form");
  await page.getByRole("button", { name: "Simulasikan buat akun" }).click();
  await expect(
    form.getByLabel("Nama panggilan", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText("Nama panggilan minimal 2 karakter."),
  ).toBeVisible();
  await expect(
    page.getByText("Masukkan alamat email yang valid."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await form
    .getByLabel("Konfirmasi kata sandi", { exact: true })
    .fill("different-password");
  await page.getByRole("button", { name: "Simulasikan buat akun" }).click();
  await expect(
    page.getByText("Konfirmasi kata sandi belum cocok."),
  ).toBeVisible();
  await expect(
    form.getByLabel("Konfirmasi kata sandi", { exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", {
      name: "Tampilkan konfirmasi kata sandi",
      exact: true,
    })
    .click();
  await expect(
    form.getByLabel("Konfirmasi kata sandi", { exact: true }),
  ).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await page.getByRole("button", { name: "Simulasikan buat akun" }).click();
  await expect(
    page.getByRole("heading", { name: "Formmu sudah siap!" }),
  ).toBeFocused();
  await expect(
    page.getByText("Akun belum dibuat dan data tidak disimpan.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Coba form lagi" }).click();
  for (const label of [
    "Nama panggilan",
    "Email",
    "Kata sandi",
    "Konfirmasi kata sandi",
  ]) {
    await expect(form.getByLabel(label, { exact: true })).toHaveValue("");
  }
  await page.getByRole("button", { name: "Isi data contoh" }).click();
  await page.getByRole("button", { name: "Simulasikan buat akun" }).click();
  await page.getByRole("button", { name: "Jelajahi demo" }).click();
  await expect(page).toHaveURL(/\/beranda$/);
  expect(mutations).toEqual([]);
  expect(
    await page.evaluate(() => ({
      cookies: document.cookie,
      session: Object.keys(sessionStorage),
      local: Object.keys(localStorage),
    })),
  ).toEqual({ cookies: "", session: [], local: [] });
});

for (const route of ["/login", "/register"]) {
  test(`Google ${route}: penjelasan prototype dan fokus kembali tanpa OAuth`, async ({
    page,
  }) => {
    const popups: string[] = [];
    page.on("popup", (popup) => popups.push(popup.url()));
    await page.goto(route);
    const google = page.getByRole("button", {
      name: "Lanjutkan dengan Google",
      exact: true,
    });
    await google.click();
    await expect(page.getByRole("dialog")).toContainText(
      "Google belum terhubung pada prototipe ini.",
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(google).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    expect(popups).toEqual([]);
  });
}
