import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "reduce" });
async function open(page: Page) {
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Voice note kilat/ }).click();
}
async function record(page: Page) {
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-timer")).toContainText("00:02");
  await page
    .getByRole("button", { name: "Hentikan rekaman", exact: true })
    .click();
  await expect(page.locator('[data-slot="voice-note"]')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate((audio: HTMLAudioElement) => audio.readyState),
    )
    .toBeGreaterThan(0);
}

for (const width of [320, 360, 390, 1280])
  for (const theme of ["light", "dark"] as const) {
    test(`Orb dan Detent ${width}px ${theme}: audio nyata, seek, speed dan transkrip`, async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["microphone"]);
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme });
      await open(page);
      const orb = page.locator('[data-slot="fluid-orb"]');
      await expect(orb).toHaveAttribute("data-renderer", "webgl");
      const recorder = page.locator(".voice-recorder");
      await expect(recorder).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(recorder).toHaveCSS("border-top-width", "0px");
      await expect(recorder).toHaveCSS("box-shadow", "none");
      const recordButton = page.getByRole("button", {
        name: "Mulai rekam",
        exact: true,
      });
      await expect(recordButton.locator("svg")).toHaveCount(0);
      await expect(recordButton.locator('[data-slot="fluid-orb"]')).toHaveCount(
        1,
      );
      await expect(recordButton).toHaveAttribute("aria-pressed", "false");
      await expect(recordButton).toBeInViewport({ ratio: 1 });
      await page.screenshot({ path: `test-results/orb-${width}-${theme}.png` });
      await record(page);
      const audio = page.locator("audio");
      const player = page.locator('[data-slot="voice-note"]');
      await expect(player).toBeInViewport({ ratio: 1 });
      await expect(player).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(player).toHaveCSS("border-top-width", "0px");
      await expect(player).toHaveCSS("box-shadow", "none");
      const centers = await player
        .locator(".detent-voice-main")
        .evaluate((row) =>
          [
            ".detent-voice-play",
            ".detent-voice-wave",
            ".detent-voice-time",
            ".detent-voice-speed",
          ].map((selector) => {
            const rect = row.querySelector(selector)!.getBoundingClientRect();
            return rect.top + rect.height / 2;
          }),
        );
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
      expect(
        await player.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1,
        ),
      ).toBe(true);
      expect(await audio.getAttribute("src")).toMatch(/^blob:/);
      const seek = page.getByRole("slider", {
        name: "Posisi rekaman",
        exact: true,
      });
      await seek.focus();
      await seek.press("ArrowRight");
      await expect
        .poll(() =>
          audio.evaluate((node: HTMLAudioElement) => node.currentTime),
        )
        .toBeGreaterThan(0.5);
      await seek.press("Home");
      await expect
        .poll(() =>
          audio.evaluate((node: HTMLAudioElement) => node.currentTime),
        )
        .toBeLessThan(0.1);
      await page
        .getByRole("button", { name: "Kecepatan 1 kali", exact: true })
        .click();
      await expect
        .poll(() =>
          audio.evaluate((node: HTMLAudioElement) => node.playbackRate),
        )
        .toBe(1.5);
      await page
        .getByRole("button", { name: "Kecepatan 1.5 kali", exact: true })
        .click();
      await expect
        .poll(() =>
          audio.evaluate((node: HTMLAudioElement) => node.playbackRate),
        )
        .toBe(2);
      await page
        .getByRole("button", { name: "Kecepatan 2 kali", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Putar rekaman", exact: true })
        .click();
      await expect
        .poll(() => audio.evaluate((node: HTMLAudioElement) => node.paused))
        .toBe(false);
      await page
        .getByRole("button", { name: "Jeda rekaman", exact: true })
        .click();
      await expect
        .poll(() => audio.evaluate((node: HTMLAudioElement) => node.paused))
        .toBe(true);
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Transkrip", exact: true }),
      ).toHaveCount(0);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/detent-player-${width}-${theme}.png`,
      });
      // Going to review must stop the old audio, even if the Blob remains available for Back.
      await seek.press("Home");
      await page
        .getByRole("button", { name: "Putar rekaman", exact: true })
        .click();
      await page.evaluate(() => {
        const a = document.querySelector("audio")!;
        a.dataset.monitored = "true";
        (
          window as unknown as { oldVoiceAudio: HTMLAudioElement }
        ).oldVoiceAudio = a;
      });
      await page.getByRole("button", { name: /Tinjau pengeluaran/ }).click();
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { oldVoiceAudio: HTMLAudioElement })
              .oldVoiceAudio.paused,
        ),
      ).toBe(true);
      await expect(
        page.getByRole("dialog", { name: "Review pengeluaran", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".scan-photo-summary")).toContainText(
        "Habis beli Nescafe coffee 12k",
      );
      await expect(page.getByLabel("Nama item 1", { exact: true })).toHaveValue(
        "Nescafe coffee",
      );
      await page
        .getByRole("button", { name: "Ubah transkrip", exact: true })
        .click();
      await page.getByLabel("Transkrip voice note").fill("kopi 12k");
      await page
        .getByRole("button", { name: "Terapkan transkrip", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Review pengeluaran", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".scan-photo-summary")).toContainText(
        "kopi 12k",
      );
      await expect(page.locator(".scan-review-total .money")).toHaveText(
        "Rp12.000",
      );
    });
  }

test("Orb tanpa WebGL tetap bisa merekam dan memutar audio", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (this.closest('[data-slot="fluid-orb"]') && type === "webgl")
          return null;
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await open(page);
  await expect(page.locator('[data-slot="fluid-orb"]')).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(
    page.locator('[data-slot="fluid-orb"] canvas'),
  ).not.toBeVisible();
  expect(
    await page
      .locator('[data-slot="fluid-orb"]')
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).not.toBe("none");
  await record(page);
  await page
    .getByRole("button", { name: "Putar rekaman", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Jeda rekaman", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "Putar rekaman", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => audio.paused),
  ).toBe(true);
});

test("Orb pulih setelah context loss, canvas gagal tidak menutupi fallback", async ({
  page,
}) => {
  await open(page);
  const orb = page.locator('[data-slot="fluid-orb"]');
  const canvas = orb.locator("canvas");
  await expect(orb).toHaveAttribute("data-renderer", "webgl");
  await canvas.evaluate((node: HTMLCanvasElement) => {
    const extension = node
      .getContext("webgl")!
      .getExtension("WEBGL_lose_context")!;
    (window as unknown as { restoreOrb: () => void }).restoreOrb = () =>
      extension.restoreContext();
    extension.loseContext();
  });
  await expect(orb).toHaveAttribute("data-renderer", "fallback");
  await expect(canvas).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mulai rekam", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: "test-results/orb-context-loss-fallback.png" });
  await page.evaluate(() =>
    (window as unknown as { restoreOrb: () => void }).restoreOrb(),
  );
  await expect(orb).toHaveAttribute("data-renderer", "webgl");
  await expect(canvas).toBeVisible();
});

test("Orb menghormati reduced motion, berhenti saat background dan melepas GPU saat Close", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const stats = { draws: 0, programs: 0, shaders: 0, buffers: 0 };
    (window as unknown as { orbStats: typeof stats }).orbStats = stats;
    const proto = WebGLRenderingContext.prototype;
    for (const [method, key] of [
      ["drawArrays", "draws"],
      ["deleteProgram", "programs"],
      ["deleteShader", "shaders"],
      ["deleteBuffer", "buffers"],
    ] as const) {
      const original = proto[method];
      Object.defineProperty(proto, method, {
        value: function (this: WebGLRenderingContext, ...args: unknown[]) {
          if (
            this.canvas instanceof HTMLCanvasElement &&
            this.canvas.closest('[data-slot="fluid-orb"]')
          )
            stats[key]++;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
  await open(page);
  await expect(page.locator('[data-slot="fluid-orb"]')).toHaveAttribute(
    "data-renderer",
    "webgl",
  );
  await page.clock.install();
  const draws = () =>
    page.evaluate(
      () =>
        (window as unknown as { orbStats: { draws: number } }).orbStats.draws,
    );
  const initial = await draws();
  await page.clock.runFor(500);
  expect(await draws()).toBe(initial);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Media-query change events are dispatched by the browser, outside the fake clock.
  await expect
    .poll(() =>
      page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    )
    .toBe(false);
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return draws();
    })
    .toBeGreaterThan(initial);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const paused = await draws();
  await page.clock.runFor(500);
  expect(await draws()).toBe(paused);
  await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
  const released = await page.evaluate(
    () =>
      (
        window as unknown as {
          orbStats: { programs: number; shaders: number; buffers: number };
        }
      ).orbStats,
  );
  expect(released.programs).toBeGreaterThan(0);
  expect(released.shaders).toBeGreaterThan(1);
  expect(released.buffers).toBeGreaterThan(0);
});

test("Play ditolak atau audio rusak menampilkan pemulihan, bukan timer palsu", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await open(page);
  await record(page);
  await page.evaluate(() => {
    document.querySelector("audio")!.play = () =>
      Promise.reject(new DOMException("Blocked", "NotAllowedError"));
  });
  await page
    .getByRole("button", { name: "Putar rekaman", exact: true })
    .click();
  await expect(page.locator(".detent-voice-error")).toContainText(
    "Audio belum bisa diputar",
  );
  await expect(
    page.getByRole("button", { name: "Jeda rekaman", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    document.querySelector("audio")!.src = "data:audio/wav;base64,AA==";
  });
  await expect(page.locator(".detent-voice-error")).toContainText(
    "Rekaman tidak bisa dibaca",
  );
  await expect(
    page.getByRole("button", { name: "Rekam ulang", exact: true }),
  ).toBeEnabled();
});
