import { expect, test, type Page } from "@playwright/test";

type AudioProbe = {
  sessionType: string;
  captureClosed: number;
  releaseClose?: () => void;
  plays: number;
  sessionAtPlay?: string;
  analyser?: AnalyserNode;
  captureTracks: MediaStreamTrack[];
  urls: string[];
};
type ProbeWindow = Window & { audioProbe: AudioProbe };

test.use({ reducedMotion: "reduce" });

async function setup(page: Page, deferClose = false) {
  await page.addInitScript(
    ({ deferClose }) => {
      const state: AudioProbe = {
        sessionType: "auto",
        captureClosed: 0,
        plays: 0,
        captureTracks: [],
        urls: [],
      };
      (window as unknown as ProbeWindow).audioProbe = state;
      // Model the optional iOS API even on desktop Chromium.
      Object.defineProperty(navigator, "audioSession", {
        configurable: true,
        value: {
          get type() {
            return state.sessionType;
          },
          set type(value: string) {
            state.sessionType = value;
          },
        },
      });
      const captures = new WeakSet<AudioContext>();
      const source = AudioContext.prototype.createMediaStreamSource;
      AudioContext.prototype.createMediaStreamSource = function (stream) {
        captures.add(this);
        return source.call(this, stream);
      };
      const close = AudioContext.prototype.close;
      AudioContext.prototype.close = async function () {
        await close.call(this);
        if (!captures.has(this)) return;
        if (deferClose)
          await new Promise<void>((resolve) => {
            state.releaseClose = resolve;
          });
        state.captureClosed++;
      };
      navigator.mediaDevices.getUserMedia = async () => {
        // Known non-silent signal, encoded by the real MediaRecorder. No fake play.
        const context = new AudioContext();
        await context.resume();
        const tone = context.createOscillator();
        tone.frequency.value = 440;
        const gain = context.createGain();
        gain.gain.value = 0.2;
        const destination = context.createMediaStreamDestination();
        tone.connect(gain).connect(destination);
        tone.start();
        state.captureTracks.push(...destination.stream.getTracks());
        return destination.stream;
      };
      const createURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        const url = createURL(blob);
        state.urls.push(url);
        return url;
      };
    },
    { deferClose },
  );
  await page.goto("/beranda");
  await page
    .locator(".expense-summary")
    .getByRole("button", { name: "Catat pengeluaran" })
    .click();
  await page.getByRole("button", { name: /Voice note kilat/ }).click();
}

async function stopRecording(page: Page) {
  await page.getByRole("button", { name: "Mulai rekam", exact: true }).click();
  await expect(page.locator(".voice-timer")).toContainText("00:02");
  await page
    .getByRole("button", { name: "Hentikan rekaman", exact: true })
    .click();
}

test("Play pertama tiap rekaman menghasilkan sinyal, setelah capture ditutup", async ({
  page,
}) => {
  await setup(page);
  for (let recording = 1; recording <= 2; recording++) {
    await stopRecording(page);
    await expect(page.locator("audio")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => (window as unknown as ProbeWindow).audioProbe.captureClosed,
      ),
    ).toBe(recording);
    expect(
      await page.evaluate(
        () => (window as unknown as ProbeWindow).audioProbe.sessionType,
      ),
    ).toBe("auto");
    await page.evaluate(() => {
      const state = (window as unknown as ProbeWindow).audioProbe;
      state.plays = 0;
      const element = document.querySelector("audio")!;
      const play = element.play.bind(element);
      element.play = () => {
        state.plays++;
        state.sessionAtPlay = state.sessionType;
        const context = new AudioContext();
        void context.resume();
        state.analyser = context.createAnalyser();
        context
          .createMediaElementSource(element)
          .connect(state.analyser)
          .connect(context.destination);
        return play();
      };
    });
    await page
      .getByRole("button", { name: "Putar rekaman", exact: true })
      .click();
    // Verify decoded audio energy, not merely paused=false or an advancing clock.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const analyser = (window as unknown as ProbeWindow).audioProbe
            .analyser!;
          const samples = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(samples);
          return Math.sqrt(
            samples.reduce((sum, n) => sum + n * n, 0) / samples.length,
          );
        }),
      )
      .toBeGreaterThan(0.03);
    expect(
      await page.evaluate(() => {
        const { plays, sessionAtPlay, captureTracks } = (
          window as unknown as ProbeWindow
        ).audioProbe;
        return {
          plays,
          sessionAtPlay,
          ended: captureTracks.every((track) => track.readyState === "ended"),
        };
      }),
    ).toEqual({ plays: 1, sessionAtPlay: "playback", ended: true });
    await page
      .getByRole("button", { name: "Jeda rekaman", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as unknown as ProbeWindow).audioProbe.sessionType,
      ),
    ).toBe("auto");
    await page
      .getByRole("button", { name: "Rekam ulang", exact: true })
      .click();
  }
});

for (const cancel of [false, true]) {
  test(`Cleanup capture tertunda: ${cancel ? "Close membatalkan hasil" : "Play menunggu sampai aman"}`, async ({
    page,
  }) => {
    await setup(page, true);
    await stopRecording(page);
    await expect
      .poll(() =>
        page.evaluate(
          () => !!(window as unknown as ProbeWindow).audioProbe.releaseClose,
        ),
      )
      .toBe(true);
    await expect(page.locator(".voice-status")).toContainText(
      "Menyiapkan rekaman",
    );
    await expect(page.locator("audio")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Tinjau pengeluaran/ }),
    ).toHaveCount(0);
    if (cancel)
      await page
        .getByRole("button", { name: "Tutup dialog", exact: true })
        .click();
    await page.evaluate(() =>
      (window as unknown as ProbeWindow).audioProbe.releaseClose!(),
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as ProbeWindow).audioProbe.captureClosed,
        ),
      )
      .toBe(1);
    if (cancel) {
      await expect(page.locator("audio")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => (window as unknown as ProbeWindow).audioProbe.urls,
        ),
      ).toEqual([]);
    } else
      await expect(
        page.getByRole("button", { name: "Putar rekaman", exact: true }),
      ).toBeEnabled();
    expect(
      await page.evaluate(
        () => (window as unknown as ProbeWindow).audioProbe.sessionType,
      ),
    ).toBe("auto");
  });
}
