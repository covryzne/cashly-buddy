import { test, expect, type Page } from "@playwright/test";

test.use({ reducedMotion: "reduce" });
const approvalKey = "cashly-camera-intro-approved";

async function openScan(page: Page) {
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
}

test("Izin granted langsung membuka kamera dan tetap berlaku setelah reload", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera"]);
  await page.goto("/beranda");
  await openScan(page);
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), approvalKey),
  ).toBe("1");
  await page.keyboard.press("Escape");
  await page.reload();
  await openScan(page);
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toHaveCount(0);
});

test("Query camera tidak didukung: pengantar hanya sekali setelah akses berhasil", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera"]);
  await page.addInitScript(() => {
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) =>
      descriptor.name === ("camera" as PermissionName)
        ? Promise.reject(new TypeError("Camera query unavailable"))
        : query(descriptor);
  });
  await page.goto("/beranda");
  await openScan(page);
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Izinkan kamera", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Catat pengeluaran baru", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Scan struk otomatis/ }).click();
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.reload();
  await openScan(page);
  await expect(
    page.getByRole("button", { name: "Ambil foto struk", exact: true }),
  ).toBeEnabled();
});

test("Izin dicabut menghapus preferensi lama dan tidak membuka kamera otomatis", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "1");
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) =>
      descriptor.name === ("camera" as PermissionName)
        ? Promise.resolve({ state: "denied" } as PermissionStatus)
        : query(descriptor);
    navigator.mediaDevices.getUserMedia = async () => {
      throw new Error("Camera must not be requested");
    };
  }, approvalKey);
  await page.goto("/beranda");
  await openScan(page);
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), approvalKey),
  ).toBeNull();
});

test("Penolakan saat buka ulang menghapus flag; percobaan berikutnya menampilkan pengantar", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "1");
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) =>
      descriptor.name === ("camera" as PermissionName)
        ? Promise.resolve({ state: "prompt" } as PermissionStatus)
        : query(descriptor);
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  }, approvalKey);
  await page.goto("/beranda");
  await openScan(page);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Izin kamera belum diberikan",
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), approvalKey),
  ).toBeNull();
  await page.keyboard.press("Escape");
  await openScan(page);
  await expect(
    page.getByRole("heading", { name: "Izinkan Akses Kamera" }),
  ).toBeVisible();
});

test("Menutup pemeriksaan izin membatalkan pembukaan kamera yang terlambat", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const target = window as unknown as {
      finishPermissionCheck?: () => void;
      cameraRequests: number;
    };
    target.cameraRequests = 0;
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) =>
      descriptor.name === ("camera" as PermissionName)
        ? new Promise<PermissionStatus>((resolve) => {
            target.finishPermissionCheck = () =>
              resolve({ state: "granted" } as PermissionStatus);
          })
        : query(descriptor);
    navigator.mediaDevices.getUserMedia = async () => {
      target.cameraRequests++;
      throw new Error("Unexpected request");
    };
  });
  await page.goto("/beranda");
  await openScan(page);
  await expect(
    page.getByText("Menyiapkan kamera…", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() =>
    (
      window as unknown as { finishPermissionCheck: () => void }
    ).finishPermissionCheck(),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { cameraRequests: number }).cameraRequests,
    ),
  ).toBe(0);
});
