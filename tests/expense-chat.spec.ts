import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce" });
async function openChat(page: Page) {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Chat manual/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Chat manual", exact: true }),
  ).toBeVisible();
}
async function send(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Catatan pengeluaran" }).fill(text);
  await page.getByRole("button", { name: "Kirim catatan" }).click();
}

for (const width of [360, 390, 1280])
  for (const theme of ["light", "dark"] as const) {
    test(`Chat ke rincian ${width}px ${theme}, nominal berasal dari pesan dan dapat dikoreksi`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      const mutations: string[] = [];
      page.on("request", (request) => {
        if (request.method() !== "GET") mutations.push(request.url());
      });
      await page.addInitScript(() => {
        navigator.mediaDevices.getUserMedia = () => {
          throw new Error("Chat must not request camera");
        };
      });
      await openChat(page);
      await expect(
        page.getByRole("button", { name: "Kirim catatan" }),
      ).toBeDisabled();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await expect(
        page.getByRole("textbox", { name: "Catatan pengeluaran" }),
      ).toHaveCSS("font-size", "16px");
      await page.screenshot({
        path: `test-results/expense-chat-${width}-${theme}.png`,
      });
      await send(page, "habis beli Nescafe coffee 12k");
      await expect(
        page.getByRole("dialog", { name: "Analisis catatan", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("progressbar", { name: "Progres analisis catatan" }),
      ).toBeVisible();
      const review = page.getByRole("dialog", {
        name: "Review pengeluaran",
        exact: true,
      });
      await expect(review).toBeVisible();
      await expect(page.getByLabel("Nama item 1", { exact: true })).toHaveValue(
        "Nescafe coffee",
      );
      await expect(
        page.getByLabel("Harga satuan item 1", { exact: true }),
      ).toHaveValue("12000");
      await expect(review.locator(".scan-review-total .money")).toHaveText(
        "Rp12.000",
      );
      await expect(page.getByLabel("Merchant (opsional)")).toHaveValue("");
      await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue(
        "food_drink",
      );
      await expect(review.locator(".scan-item-total")).toHaveCount(0);
      await page.getByLabel("Jumlah item 1", { exact: true }).fill("2");
      await expect(
        review.getByRole("button", { name: /Simpan pengeluaran Rp24.000/ }),
      ).toBeInViewport({ ratio: 1 });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/expense-chat-review-${width}-${theme}.png`,
      });
      await review.getByRole("button", { name: /Simpan pengeluaran/ }).click();
      await expect(
        page.getByRole("dialog", { name: "Konfirmasi pengeluaran" }),
      ).toBeVisible();
      await expect(page.locator(".scan-success-hero")).toContainText(
        "Rp24.000",
      );
      await page.getByRole("button", { name: "Kembali ke Beranda" }).click();
      await expect(page.locator(".hero-amount")).toHaveText("Rp1.248.500");
      await expect(page.locator(".xp-pill")).toContainText("340 XP");
      expect(mutations).toEqual([]);
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((key) => key !== "cashly-theme"),
        ),
      ).toEqual([]);
    });
  }

test("Pesan belum lengkap meminta nominal lalu melanjutkan dari jawaban singkat", async ({
  page,
}) => {
  await openChat(page);
  await send(page, "beli Nescafe coffee");
  await expect(page.getByRole("log")).toContainText("Nominalnya berapa");
  await send(page, "12k");
  await expect(
    page.getByRole("dialog", { name: "Review pengeluaran" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nama item 1", { exact: true })).toHaveValue(
    "Nescafe coffee",
  );
  await expect(
    page.getByLabel("Harga satuan item 1", { exact: true }),
  ).toHaveValue("12000");
});

test("Back mempertahankan percakapan, nominal baru diparsing ulang, dan Catat lagi membuka chat bersih", async ({
  page,
}) => {
  await openChat(page);
  await send(page, "kopi 12k");
  await expect(
    page.getByRole("dialog", { name: "Review pengeluaran" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ubah pesan" }).click();
  await expect(page.getByRole("log")).toContainText("kopi 12k");
  await expect(
    page.getByRole("textbox", { name: "Catatan pengeluaran" }),
  ).toHaveValue("kopi 12k");
  await send(page, "kopi 15k dan roti 8k");
  await expect(page.locator(".scan-items > li")).toHaveCount(2);
  await expect(page.locator(".scan-review-total .money")).toHaveText(
    "Rp23.000",
  );
  await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
  await page.getByRole("button", { name: "Catat lagi", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Catatan pengeluaran" }),
  ).toHaveValue("");
  await expect(page.getByRole("log")).not.toContainText("kopi 15k");
});

test("Batal dan Close saat parsing tidak membuka review yang terlambat", async ({
  page,
}) => {
  await openChat(page);
  await page.clock.install();
  await send(page, "kopi 12k");
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await page.clock.runFor(5000);
  await expect(
    page.getByRole("dialog", { name: "Chat manual", exact: true }),
  ).toBeVisible();
  await send(page, "kopi 18k");
  await page.keyboard.press("Escape");
  await page.clock.runFor(5000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Enter/Shift+Enter dan contoh composer; kategori belum diketahui harus dipilih", async ({
  page,
}) => {
  await openChat(page);
  const input = page.getByRole("textbox", { name: "Catatan pengeluaran" });
  await input.fill("kaos 100k");
  await input.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
  });
  await expect(
    page.getByRole("dialog", { name: "Chat manual", exact: true }),
  ).toBeVisible();
  await input.press("Shift+Enter");
  await expect(input).toHaveValue("kaos 100k\n");
  await input.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Review pengeluaran" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
  await expect(page.getByLabel("Kategori", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await page.getByRole("button", { name: "Lihat contoh catatan" }).click();
  await page
    .locator(".expense-chat-composer")
    .getByRole("button", { name: "Ojek 18k", exact: true })
    .click();
  await expect(input).toHaveValue("Ojek 18k");
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Catat pengeluaran baru", exact: true }),
  ).toBeVisible();
});
