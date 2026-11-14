"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = {
  status: "idle" | "requesting" | "ready" | "error";
  stream: MediaStream | null;
  error: string;
  torch: boolean;
  supportsTorch: boolean;
};
const idle: CameraState = {
  status: "idle",
  stream: null,
  error: "",
  torch: false,
  supportsTorch: false,
};
const release = (stream: MediaStream | null) =>
  stream?.getTracks().forEach((track) => track.stop());

function cameraError(error: unknown) {
  const name =
    error instanceof DOMException || error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Izin kamera belum diberikan. Izinkan kamera lewat pengaturan situs, coba lagi, atau buka galeri.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "Kamera tidak ditemukan. Kamu tetap bisa memilih foto struk dari galeri.";
  if (name === "NotReadableError" || name === "AbortError")
    return "Kamera belum bisa digunakan. Tutup aplikasi lain yang memakai kamera, lalu coba lagi.";
  return "Kamera belum berhasil dibuka. Coba lagi atau pilih foto dari galeri.";
}

export function useReceiptCamera() {
  const [state, setState] = useState<CameraState>(idle);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef({ version: 0 });
  const alive = useRef(true);
  const stop = useCallback(() => {
    generation.current.version++;
    release(streamRef.current);
    streamRef.current = null;
    if (alive.current) setState(idle);
  }, []);
  useEffect(() => {
    alive.current = true;
    const requests = generation.current;
    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", stop);
    return () => {
      alive.current = false;
      requests.version++;
      release(streamRef.current);
      streamRef.current = null;
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", stop);
    };
  }, [stop]);
  const request = useCallback(async () => {
    stop();
    const requestId = ++generation.current.version;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState({
        ...idle,
        status: "error",
        error: !window.isSecureContext
          ? "Kamera memerlukan HTTPS atau localhost. Kamu tetap bisa membuka galeri dari halaman ini."
          : "Browser ini belum mendukung akses kamera. Pilih foto struk dari galeri.",
      });
      return;
    }
    setState({ ...idle, status: "requesting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      });
      if (
        !alive.current ||
        requestId !== generation.current.version ||
        document.hidden
      ) {
        release(stream);
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState !== "live") {
        release(stream);
        throw new DOMException("No video", "NotFoundError");
      }
      let supportsTorch = false;
      try {
        supportsTorch = Boolean(
          (
            track.getCapabilities?.() as
              (MediaTrackCapabilities & { torch?: boolean }) | undefined
          )?.torch,
        );
      } catch {
        /* Capability probing is optional. */
      }
      track.addEventListener(
        "ended",
        () => {
          if (alive.current && streamRef.current === stream) {
            stop();
            setState({
              ...idle,
              status: "error",
              error:
                "Kamera berhenti. Tekan Aktifkan kamera untuk melanjutkan.",
            });
          }
        },
        { once: true },
      );
      setState({
        status: "ready",
        stream,
        supportsTorch,
        torch: false,
        error: "",
      });
    } catch (error) {
      if (alive.current && requestId === generation.current.version) {
        release(streamRef.current);
        streamRef.current = null;
        setState({ ...idle, status: "error", error: cameraError(error) });
      }
    }
  }, [stop]);
  const toggleTorch = async () => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track || !state.supportsTorch) return;
    const torch = !state.torch;
    try {
      const advanced: MediaTrackConstraintSet & { torch: boolean } = { torch };
      await track.applyConstraints({ advanced: [advanced] });
      if (alive.current && streamRef.current === stream)
        setState((previous) => ({ ...previous, torch, error: "" }));
    } catch {
      if (alive.current && streamRef.current === stream)
        setState((previous) => ({
          ...previous,
          error:
            "Lampu belum dapat diubah. Gunakan pencahayaan sekitar yang cukup.",
        }));
    }
  };
  return { ...state, request, stop, toggleTorch };
}

type CaptureRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

// Map the visible frame back through the video's object-fit: cover transform.
export function receiptCaptureBounds(
  source: { width: number; height: number },
  viewport: CaptureRect,
  frame: CaptureRect,
) {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    frame.width <= 0 ||
    frame.height <= 0
  )
    throw new Error("Bingkai kamera belum siap.");
  const coverScale = Math.max(
    viewport.width / source.width,
    viewport.height / source.height,
  );
  const x = Math.max(
    0,
    (frame.left -
      viewport.left +
      (source.width * coverScale - viewport.width) / 2) /
      coverScale,
  );
  const y = Math.max(
    0,
    (frame.top -
      viewport.top +
      (source.height * coverScale - viewport.height) / 2) /
      coverScale,
  );
  return {
    x,
    y,
    width: Math.min(source.width - x, frame.width / coverScale),
    height: Math.min(source.height - y, frame.height / coverScale),
  };
}

export async function captureReceipt(
  video: HTMLVideoElement,
  frame: HTMLElement | null = null,
) {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight)
    throw new Error("Tunggu hingga tampilan kamera siap.");
  const targetRatio = 3 / 4;
  let width = video.videoWidth;
  let height = video.videoHeight;
  if (width / height > targetRatio) width = height * targetRatio;
  else height = width / targetRatio;
  const bounds = frame
    ? receiptCaptureBounds(
        { width: video.videoWidth, height: video.videoHeight },
        video.getBoundingClientRect(),
        frame.getBoundingClientRect(),
      )
    : {
        x: (video.videoWidth - width) / 2,
        y: (video.videoHeight - height) / 2,
        width,
        height,
      };
  width = bounds.width;
  height = bounds.height;
  const scale = Math.min(1, 2048 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto belum dapat diambil. Coba galeri.");
  context.drawImage(
    video,
    bounds.x,
    bounds.y,
    width,
    height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Foto belum dapat dibuat. Coba lagi.")),
      "image/jpeg",
      0.9,
    ),
  );
}
