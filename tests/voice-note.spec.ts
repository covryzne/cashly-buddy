import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type VoiceWindow = Window & {
  voiceCalls: number;
  voiceStream?: MediaStream;
  revokedVoiceUrls: string[];
  voiceChunks: number;
  resolveVoice?: () => void;
};
test.use({ reducedMotion: "reduce" });
async function monitor(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as VoiceWindow;
    state.voiceCalls = 0;
    state.revokedVoiceUrls = [];
    state.voiceChunks = 0;
    const start = MediaRecorder.prototype.start;
    MediaRecorder.prototype.start = function (...args) {
      this.addEventListener("dataavailable", (event) => {
        if (event.data.size) state.voiceChunks++;
      });
      return start.apply(this, args);
    };
    const getMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      state.voiceCalls++;
      if (constraints?.video) throw new Error("VN must not request a camera");
      const stream = await getMedia(constraints);
      state.voiceStream = stream;
      return stream;
    };
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => {
      state.revokedVoiceUrls.push(url);
      revoke(url);
    };
  });
}
async function openVoice(page: Page) {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Voice note kilat/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Voice note kilat", exact: true }),
  ).toBeVisible();
}
async function streamEnded(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as VoiceWindow).voiceStream
          ?.getTracks()
          .every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
}

for (const width of [360, 390, 1280])
  for (const theme of ["light", "dark"] as const) {
    test(`VN ${width}px ${theme}: transkrip setelah Tinjau, koreksi, review dan konfirmasi`, async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["microphone"]);
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme });
      await monitor(page);
      const requests: string[] = [];
      page.on("request", (request) => {
        if (request.method() !== "GET") requests.push(request.url());
      });
      await openVoice(page);
      expect(
        await page.evaluate(
          () => (window as unknown as VoiceWindow).voiceCalls,
        ),
      ).toBe(0);
      await expect(
        page.getByRole("button", { name: "Mulai rekam", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/voice-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", { name: "Mulai rekam", exact: true })
        .click();
      await expect(page.locator(".voice-timer")).toContainText("00:01");
      await page
        .getByRole("button", { name: "Hentikan rekaman", exact: true })
        .click();
      await expect(page.locator('[data-slot="voice-note"]')).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await page.getByRole("button", { name: /Tinjau pengeluaran/ }).click();
      await expect(
        page.getByRole("dialog", { name: "Analisis voice note", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("dialog", { name: "Review pengeluaran", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".scan-photo-summary")).toContainText(
        "Habis beli Nescafe coffee 12k",
      );
      await page
        .getByRole("button", { name: "Ubah transkrip", exact: true })
        .click();
      await expect(page.getByLabel("Transkrip voice note")).toHaveValue(
        "Habis beli Nescafe coffee 12k",
      );
      await page.getByLabel("Transkrip voice note").fill("kopi");
      await page
        .getByRole("button", { name: "Terapkan transkrip", exact: true })
        .click();
      await expect(page.locator("#voice-source-error")).toContainText(
        "Nominalnya berapa",
      );
      await page
        .getByLabel("Transkrip voice note")
        .fill("kopi 18k dan roti 8k");
      await page
        .getByRole("button", { name: "Terapkan transkrip", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Analisis voice note", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("dialog", { name: "Review pengeluaran", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".scan-review-total .money")).toHaveText(
        "Rp26.000",
      );
      await expect(page.locator(".scan-photo-summary")).toContainText(
        "Catatan dari voice note",
      );
      await page
        .getByRole("button", { name: "Ubah transkrip", exact: true })
        .click();
      await expect(page.getByLabel("Transkrip voice note")).toHaveValue(
        "kopi 18k dan roti 8k",
      );
      await page
        .getByLabel("Transkrip voice note")
        .fill("perubahan belum diterapkan");
      await page.getByRole("button", { name: "Kembali", exact: true }).click();
      await expect(page.locator(".scan-photo-summary")).toContainText(
        "kopi 18k dan roti 8k",
      );
      await page
        .getByRole("button", { name: /Simpan pengeluaran Rp26.000/ })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Konfirmasi pengeluaran" }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("button", { name: "Catat lagi", exact: true })
          .locator("svg.lucide-mic"),
      ).toHaveCount(1);
      await page
        .getByRole("button", { name: "Catat lagi", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Mulai rekam", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      expect(requests).toEqual([]);
    });
  }

test("Rekam nyata browser uji: izin saat klik, stop, playback, transkrip dan cleanup URL", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await monitor(page);
  await openVoice(page);
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-status")).toContainText("Sedang merekam");
  await expect(page.locator(".voice-timer")).toContainText("00:01");
  await page
    .getByRole("button", { name: "Hentikan rekaman", exact: true })
    .click();
  const audio = page.getByLabel("Putar rekaman pengeluaran");
  await expect(page.locator('[data-slot="voice-note"]')).toBeVisible();
  await streamEnded(page);
  const src = await audio.getAttribute("src");
  expect(src).toMatch(/^blob:/);
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.readyState),
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Putar rekaman", exact: true })
    .click();
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(false);
  await page.getByRole("button", { name: "Jeda rekaman", exact: true }).click();
  await page
    .getByRole("button", { name: "Kecepatan 1 kali", exact: true })
    .click();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.playbackRate),
    )
    .toBe(1.5);
  await expect(
    page.getByRole("button", { name: /Tinjau pengeluaran/ }),
  ).toBeEnabled();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Rekam ulang", exact: true }).click();
  expect(
    await page.evaluate(
      (url) =>
        (window as unknown as VoiceWindow).revokedVoiceUrls.includes(url!),
      src,
    ),
  ).toBe(true);
  await expect(audio).toHaveCount(0);
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Hentikan rekaman", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await streamEnded(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Izin ditolak dapat dicoba ulang atau beralih ke chat", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await openVoice(page);
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-error[role=alert]")).toContainText(
    "Akses mikrofon belum diizinkan",
  );
  await expect(
    page.getByRole("button", { name: "Mulai rekam", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Catat lewat chat", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Chat manual", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Voice note kilat", exact: true }),
  ).toBeVisible();
});

test("Izin terlambat setelah Close tidak meninggalkan mikrofon aktif", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await monitor(page);
  await page.addInitScript(() => {
    const getMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = (constraints) =>
      new Promise((resolve) => {
        (window as unknown as VoiceWindow).resolveVoice = () => {
          void getMedia(constraints).then(resolve);
        };
      });
  });
  await openVoice(page);
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-status")).toContainText(
    "Menunggu izin mikrofon",
  );
  await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as VoiceWindow).resolveVoice?.(),
  );
  await streamEnded(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Meninggalkan halaman membatalkan rekaman dan melepas mikrofon", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await monitor(page);
  await openVoice(page);
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-status")).toContainText("Sedang merekam");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await streamEnded(page);
  await expect(
    page.getByRole("button", { name: "Mulai rekam", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Putar rekaman pengeluaran")).toHaveCount(0);
});

test("Browser tanpa MediaRecorder tetap menawarkan teks dan contoh", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: undefined,
    });
  });
  await openVoice(page);
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-error[role=alert]")).toContainText(
    "Perekam belum tersedia",
  );
  await expect(
    page.getByRole("button", { name: "Catat lewat chat", exact: true }),
  ).toBeEnabled();
});

test("Batas 60 detik menghentikan rekaman otomatis", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await monitor(page);
  await openVoice(page);
  await page.clock.install();
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-status")).toContainText("Sedang merekam");
  await page.clock.runFor(1000);
  // The codec runs in real time even when JavaScript timers are advanced.
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as VoiceWindow).voiceChunks),
    )
    .toBeGreaterThan(0);
  await page.clock.fastForward(60000);
  await expect(page.locator('[data-slot="voice-note"]')).toBeVisible();
  await expect(page.locator(".voice-timer")).toContainText("01:00");
  await streamEnded(page);
});

for (const width of [320, 375, 390, 430])
  test(`Modal Catat tetap muat ${width}px dengan teks diperbesar`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/beranda");
    await page
      .locator(".expense-summary")
      .getByRole("button", { name: "Catat pengeluaran" })
      .click();
    await page.addStyleTag({
      content:
        ".speed-pod-copy strong { font-size: 18px; } .speed-pod-copy small { font-size: 16px; }",
    });
    const sheet = page.getByRole("dialog", {
      name: "Catat pengeluaran baru",
      exact: true,
    });
    expect(
      await sheet.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    for (const card of await sheet.locator(".speed-pod").all()) {
      const bounds = await card.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(
        await card.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBe(true);
    }
  });
