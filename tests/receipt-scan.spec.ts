import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { exampleReceipt } from "../src/mocks/fixtures/receipt";
import { receiptCaptureBounds } from "../src/features/scan/use-receipt-camera";
import {
  receiptAmounts,
  receiptSchema,
} from "../src/features/scan/receipt-schema";

test.use({ reducedMotion: "reduce" });

type CameraTestWindow = Window & {
  finishImageDecode?: () => void;
  cameraCalls: number;
  cameraStops: number;
  lastStream?: MediaStream;
  finishCameraRequest?: () => void;
  revokedUrls: string[];
  createdUrls: string[];
};
const openScan = async (page: Page, mode: "intro" | "camera" = "intro") => {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
  if (mode === "camera") {
    await expect(
      page.getByRole("dialog", { name: "AI OCR Scanner", exact: true }),
    ).toBeVisible();
    return;
  }
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toBeVisible();
};
const galleryFixture = async (page: Page) => {
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 48;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, 32, 48);
    context.fillStyle = "#222";
    context.fillRect(6, 8, 20, 2);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return {
    name: "receipt-fixture.png",
    mimeType: "image/png",
    buffer: Buffer.from(image, "base64"),
  };
};
const installCameraMonitor = async (page: Page, pending = false) => {
  await page.addInitScript(
    ({ pending }) => {
      const target = window as unknown as CameraTestWindow;
      target.cameraCalls = 0;
      target.cameraStops = 0;
      target.revokedUrls = [];
      target.createdUrls = [];
      const create = URL.createObjectURL.bind(URL),
        revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        const url = create(blob);
        target.createdUrls.push(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        target.revokedUrls.push(url);
        revoke(url);
      };
      const original = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices,
      );
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        target.cameraCalls++;
        if (pending)
          await new Promise<void>((resolve) => {
            target.finishCameraRequest = resolve;
          });
        const stream = await original(constraints);
        target.lastStream = stream;
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            target.cameraStops++;
            stop();
          };
        }
        return stream;
      };
    },
    { pending },
  );
};

test("Scrollbar tersembunyi tetap mendukung scroll halaman, wheel, dan keyboard pada review", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/beranda");
  await page.mouse.move(190, 600);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await openScan(page);
  await page
    .getByRole("button", { name: "Coba struk contoh", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Review struk",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("scrollbar-width", "none");
  await page.mouse.move(190, 500);
  const start = await dialog.evaluate((element) => element.scrollTop);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => dialog.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(start);
  await dialog
    .getByRole("button", { name: "Tutup dialog" })
    .evaluate((element: HTMLButtonElement) =>
      element.focus({ preventScroll: true }),
    );
  const beforeKeyboard = await dialog.evaluate((element) => element.scrollTop);
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => dialog.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(beforeKeyboard);
  await page.keyboard.press("End");
  await expect(
    page.getByLabel("Waktu (WIB)", { exact: true }),
  ).toBeInViewport();
  await expect(
    dialog.getByRole("button", { name: /Simpan pengeluaran/ }),
  ).toBeInViewport({ ratio: 1 });
});

test("Crop foto mengikuti jendela pada video fullscreen", () => {
  const bounds = receiptCaptureBounds(
    { width: 1280, height: 720 },
    { left: 0, top: 0, width: 390, height: 844 },
    { left: 55, top: 200, width: 280, height: 360 },
  );
  expect(bounds.width / bounds.height).toBeCloseTo(7 / 9);
  expect(bounds.x).toBeGreaterThan(0);
  expect(bounds.y).toBeCloseTo(200 / (844 / 720));
  expect(bounds.width).toBeLessThan(1280);
  expect(() =>
    receiptCaptureBounds(
      { width: 1280, height: 720 },
      { left: 0, top: 0, width: 0, height: 0 },
      { left: 0, top: 0, width: 280, height: 360 },
    ),
  ).toThrow("Bingkai kamera belum siap");
});

test("Review memakai integer IDR, diskon/pajak eksplisit, dan validasi item", () => {
  const draft = exampleReceipt();
  expect(receiptSchema.safeParse(draft).success).toBe(true);
  draft.occurredTime = "14:02:30";
  expect(receiptSchema.safeParse(draft).success).toBe(true);
  draft.occurredTime = "14:02:99";
  expect(receiptSchema.safeParse(draft).success).toBe(false);
  draft.occurredTime = "14:02";
  expect(receiptAmounts(draft).total.toString()).toBe("47500");
  draft.items[0].quantity = "2";
  draft.discountIdr = "1000";
  draft.taxIdr = "2000";
  expect(receiptAmounts(draft).total.toString()).toBe("58000");
  draft.discountIdr = "999999999999";
  expect(receiptSchema.safeParse(draft).success).toBe(false);
  draft.discountIdr = "0";
  draft.items[0].quantity = "0";
  expect(receiptSchema.safeParse(draft).success).toBe(false);
  draft.items[0].quantity = "1";
  draft.occurredDate = "2026-02-30";
  expect(receiptSchema.safeParse(draft).success).toBe(false);
});

for (const width of [360, 390, 1280]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Alur struk contoh, review, konfirmasi ${width} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await installCameraMonitor(page);
      const mutations: string[] = [];
      page.on("request", (request) => {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()))
          mutations.push(request.url());
      });
      await openScan(page);
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as CameraTestWindow).cameraCalls,
          ),
        )
        .toBe(0);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/scan-permission-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", { name: "Coba struk contoh", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "Review struk" });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".scan-review-total .money")).toHaveText(
        "Rp47.500",
      );
      await expect(dialog.locator(".scan-items > li")).toHaveCount(4);
      await expect(
        dialog.getByLabel("Metode pembayaran (opsional)"),
      ).toHaveValue("QRIS");
      await expect(
        dialog.getByRole("button", { name: /Simpan pengeluaran/ }),
      ).toBeInViewport({ ratio: 1 });
      expect(
        await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/scan-review-${width}-${theme}.png`,
      });
      await dialog
        .locator(".scan-items > li")
        .first()
        .evaluate((element) => element.scrollIntoView({ block: "center" }));
      await page.screenshot({
        path: `test-results/scan-review-items-${width}-${theme}.png`,
      });
      await dialog.getByLabel("Harga satuan item 1").fill("10000");
      await dialog.getByLabel("Jumlah item 1").fill("2");
      await expect(dialog.locator(".scan-review-total .money")).toHaveText(
        "Rp58.000",
      );
      await dialog.getByRole("button", { name: "Tambah", exact: true }).click();
      await dialog
        .getByLabel("Nama item 5", { exact: true })
        .fill("Air mineral");
      await dialog
        .getByLabel("Harga satuan item 5", { exact: true })
        .fill("5000");
      await expect(dialog.locator(".scan-review-total .money")).toHaveText(
        "Rp63.000",
      );
      await dialog
        .getByRole("button", { name: "Hapus item 5", exact: true })
        .click();
      await dialog.getByRole("button", { name: /Simpan pengeluaran/ }).click();
      await expect(
        page.getByRole("dialog", { name: "Konfirmasi pengeluaran" }),
      ).toBeVisible();
      await expect(page.locator(".scan-success-hero")).toContainText(
        "Rp58.000",
      );
      await expect(
        page.getByRole("heading", { name: "Catatanmu siap!" }),
      ).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".scan-success-merchant .money")).toHaveText(
        "−Rp58.000",
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/scan-success-${width}-${theme}.png`,
      });
      await page.getByRole("button", { name: "Kembali", exact: true }).click();
      await expect(page.getByLabel("Harga satuan item 1")).toHaveValue("10000");
      await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
      await page
        .getByRole("button", { name: "Kembali ke Beranda", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
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
}

for (const width of [360, 390, 1280]) {
  test(`Visual kamera mengikuti aset ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
    // A receipt-shaped virtual video is a visual fixture, never product OCR output.
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 390;
        canvas.height = 844;
        const context = canvas.getContext("2d")!;
        context.fillStyle = "#241e36";
        context.fillRect(0, 0, 390, 844);
        context.fillStyle = "#a39aaf";
        context.fillRect(74, 176, 242, 340);
        context.fillStyle = "#494053";
        context.textAlign = "center";
        context.font = "bold 12px sans-serif";
        context.fillText("INDOMARET POINT", 195, 198);
        context.font = "10px sans-serif";
        context.fillText("JL. SENOPATI NO. 42B, JKT", 195, 214);
        context.fillText("STRUK CONTOH / DEMO", 195, 230);
        context.textAlign = "left";
        context.font = "10px monospace";
        for (const [index, line] of [
          "OATSIDE BARISTA 200ML      9.500",
          "ROTI TAWAR GANDUM        18.000",
          "ULTRA MILK KARAMEL        7.000",
          "SNACK CHITATO LITE       13.000",
        ].entries())
          context.fillText(line, 87, 266 + index * 20);
        context.font = "bold 12px sans-serif";
        context.fillText("TOTAL BELANJA", 87, 361);
        context.fillText("Rp47.500", 254, 361);
        return canvas.captureStream(10);
      };
    });
    await openScan(page);
    await page
      .getByRole("button", { name: "Izinkan kamera", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Ambil foto struk" }),
    ).toBeEnabled();
    const dialog = page.getByRole("dialog");
    const root = (await dialog.boundingBox())!;
    const feed = (await page
      .getByLabel("Pratinjau kamera struk")
      .boundingBox())!;
    const frame = (await page.locator(".scan-viewfinder").boundingBox())!;
    expect(feed.width).toBeGreaterThanOrEqual(root.width - 2);
    expect(feed.height).toBeGreaterThanOrEqual(root.height - 2);
    expect(frame.width).toBeCloseTo(280);
    expect(frame.height).toBeCloseTo(360);
    await expect(page.locator(".scan-merchant-tag")).toContainText(
      "Indomaret Point",
    );
    await expect(page.locator(".scan-total-tag")).toHaveText("Total: Rp47.500");
    await expect(
      page.getByRole("button", { name: "Tutup dialog" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Ambil foto struk" }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Buka galeri" }),
    ).toBeInViewport({ ratio: 1 });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/scan-reference-match-${width}.png`,
    });
    await page.getByRole("button", { name: "Ambil foto struk" }).click();
    await expect(
      page.getByRole("dialog", { name: "Analisis struk", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".scan-review-total .money")).toHaveText(
      "Rp47.500",
    );
    await expect(page.locator(".scan-items > li")).toHaveCount(4);
    await expect(page.locator(".scan-photo-summary")).toContainText(
      "Foto struk siap",
    );
    await page.screenshot({
      path: `test-results/scan-after-capture-${width}.png`,
    });
  });
}

test("Kamera nyata browser uji: izin lewat klik, foto, retake, dan cleanup", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await context.grantPermissions(["camera"]);
  await installCameraMonitor(page);
  await openScan(page, "camera");
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".scan-camera-status")).toContainText(
    "Kamera aktif",
  );
  await expect(
    page.getByRole("button", { name: "Lampu kamera" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as CameraTestWindow).lastStream?.getAudioTracks()
          .length,
    ),
  ).toBe(0);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/scan-camera-live.png" });
  await page
    .getByRole("button", { name: "Ambil foto struk", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Analisis struk", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as CameraTestWindow
          ).lastStream?.getVideoTracks()[0].readyState,
      ),
    )
    .toBe("ended");
  await expect(
    page.getByRole("dialog", { name: "Review struk" }),
  ).toBeVisible();
  await expect(page.getByLabel("Merchant (opsional)")).toHaveValue(
    "Indomaret Point",
  );
  await expect(page.locator(".scan-review-total .money")).toHaveText(
    "Rp47.500",
  );
  await expect(page.locator(".scan-items > li")).toHaveCount(4);
  await expect(page.locator(".scan-photo-summary")).toContainText(
    "Periksa dan sesuaikan rincian",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as CameraTestWindow
          ).lastStream?.getVideoTracks()[0].readyState,
      ),
    )
    .toBe("ended");
  const photo = page.getByRole("img", { name: "Foto struk untuk ditinjau" });
  await expect(photo).toHaveAttribute("src", /^blob:/);
  await expect
    .poll(() => photo.evaluate((node: HTMLImageElement) => node.naturalWidth))
    .toBeGreaterThan(0);
  expect(
    await photo.evaluate(
      (node: HTMLImageElement) => node.naturalWidth / node.naturalHeight,
    ),
  ).toBeCloseTo(7 / 9, 2);
  await page.getByRole("button", { name: "Ulang", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ambil foto struk" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Panduan scan", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Panduan scan" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as CameraTestWindow
          ).lastStream?.getVideoTracks()[0].readyState,
      ),
    )
    .toBe("ended");
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ambil foto struk" }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as CameraTestWindow
          ).lastStream?.getVideoTracks()[0].readyState,
      ),
    )
    .toBe("ended");
  expect(
    await page.evaluate(() =>
      (window as unknown as CameraTestWindow).createdUrls.every((url) =>
        (window as unknown as CameraTestWindow).revokedUrls.includes(url),
      ),
    ),
  ).toBe(true);
});

test("Batal saat analisis foto kamera membersihkan stream dan foto sementara", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera"]);
  await installCameraMonitor(page);
  await openScan(page, "camera");
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
  await page.clock.install();
  await page
    .getByRole("button", { name: "Ambil foto struk", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Analisis struk", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as CameraTestWindow
          ).lastStream?.getVideoTracks()[0].readyState,
      ),
    )
    .toBe("ended");
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await page.clock.fastForward(5000);
  await expect(
    page.getByRole("dialog", { name: "Catat pengeluaran baru", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Review struk", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const state = window as unknown as CameraTestWindow;
      return (
        state.createdUrls.length > 0 &&
        state.createdUrls.every((url) => state.revokedUrls.includes(url))
      );
    }),
  ).toBe(true);
});

test("Kamera ditolak, pemulihan galeri dan Kembali tetap tersedia", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await openScan(page);
  await page
    .getByRole("button", { name: "Izinkan kamera", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Izin kamera belum diberikan",
  );
  await expect(
    page.getByRole("button", { name: "Ambil foto struk" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Buka galeri" })).toBeEnabled();
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await page.getByRole("button", { name: "Nanti saja", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Catat pengeluaran baru" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Scan struk otomatis/ }),
  ).toBeFocused();
});

test("Permintaan kamera terlambat setelah modal ditutup langsung dilepas", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera"]);
  await installCameraMonitor(page, true);
  await openScan(page, "camera");
  await expect(
    page.getByText("Pilih Izinkan pada permintaan kamera browser."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() =>
    (window as unknown as CameraTestWindow).finishCameraRequest?.(),
  );
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as CameraTestWindow).cameraStops),
    )
    .toBeGreaterThan(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Halaman tersembunyi menghentikan kamera tanpa membuka ulang otomatis", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera"]);
  await installCameraMonitor(page);
  await openScan(page, "camera");
  await expect(
    page.getByRole("button", { name: "Ambil foto struk" }),
  ).toBeEnabled();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as CameraTestWindow
          ).lastStream?.getVideoTracks()[0].readyState,
      ),
    )
    .toBe("ended");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "Aktifkan kamera" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as CameraTestWindow).cameraCalls,
    ),
  ).toBe(1);
});

test("Galeri valid, file rusak/tipe salah/oversize, dan validasi review", async ({
  page,
}) => {
  await installCameraMonitor(page);
  await openScan(page);
  const input = page.getByLabel("Pilih foto struk", { exact: true });
  await input.setInputFiles({
    name: "receipt.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "JPEG, PNG, atau WebP",
  );
  await input.setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "maksimal 10 MB",
  );
  await input.setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from("corrupted"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Foto tidak bisa dibaca",
  );
  // A generated image exercises the browser decode path without private data.
  await input.setInputFiles(await galleryFixture(page));
  await expect(
    page.getByRole("dialog", { name: "Review struk" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nama item 1", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Periksa isian",
  );
  await expect(page.getByLabel("Kategori", { exact: true })).toBeFocused();
  await page.getByLabel("Kategori", { exact: true }).selectOption("food_drink");
  await page.getByLabel("Nama item 1", { exact: true }).fill("Kopi");
  await page.getByLabel("Harga satuan item 1", { exact: true }).fill("28000");
  await page.getByLabel("Diskon / kupon (Rp)").fill("30000");
  await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
  await expect(
    page.getByText("Total pengeluaran harus lebih dari Rp0.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Diskon / kupon (Rp)").fill("0");
  await page.getByRole("button", { name: /Simpan pengeluaran/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Konfirmasi pengeluaran" }),
  ).toBeVisible();
  await expect(page.locator(".scan-success-hero")).toContainText("Rp28.000");
  expect(
    await page.evaluate(
      () => (window as unknown as CameraTestWindow).cameraCalls,
    ),
  ).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      (window as unknown as CameraTestWindow).createdUrls.every((url) =>
        (window as unknown as CameraTestWindow).revokedUrls.includes(url),
      ),
    ),
  ).toBe(true);
});

test("Browser tanpa API kamera menyediakan galeri dan contoh", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
  });
  await openScan(page);
  await page
    .getByRole("button", { name: "Izinkan kamera", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "belum mendukung akses kamera",
  );
  await page
    .getByRole("button", { name: "Coba struk contoh", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Review struk" }),
  ).toBeVisible();
});

test("HTTP tidak aman tidak meminta kamera dan menawarkan galeri", async ({
  page,
}) => {
  await installCameraMonitor(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
  });
  await openScan(page);
  await page
    .getByRole("button", { name: "Izinkan kamera", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "HTTPS atau localhost",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as CameraTestWindow).cameraCalls,
    ),
  ).toBe(0);
  await expect(page.getByRole("button", { name: "Buka galeri" })).toBeEnabled();
});

test("Foto galeri yang masih diproses dilepas saat modal ditutup", async ({
  page,
}) => {
  await installCameraMonitor(page);
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      await new Promise<void>((resolve) => {
        (window as unknown as CameraTestWindow).finishImageDecode = resolve;
      });
    };
  });
  await openScan(page);
  await page
    .getByLabel("Pilih foto struk", { exact: true })
    .setInputFiles(await galleryFixture(page));
  await expect(
    page.getByText("Menyiapkan foto…", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean((window as unknown as CameraTestWindow).finishImageDecode),
      ),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(() =>
      (window as unknown as CameraTestWindow).createdUrls.every((url) =>
        (window as unknown as CameraTestWindow).revokedUrls.includes(url),
      ),
    ),
  ).toBe(true);
  await page.evaluate(() =>
    (window as unknown as CameraTestWindow).finishImageDecode?.(),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
