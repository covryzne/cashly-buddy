"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acquireVoiceAudioSession } from "@/lib/voice-audio-session";

type Status =
  "idle" | "requesting" | "recording" | "stopping" | "ready" | "error";
const MAX_SECONDS = 60;
const MAX_BYTES = 5 * 1024 * 1024;

export function useVoiceRecorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const beganAt = useRef(0);
  const stoppedAt = useRef<number | null>(null);
  const levels = useRef<number[]>([]);
  const sequence = useRef(0);
  const requesting = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const closing = useRef<Promise<void>>(Promise.resolve());
  const finishing = useRef(false);
  const session = useRef<(() => void) | null>(null);
  const url = useRef<string | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const invalidate = useCallback(() => {
    ++sequence.current;
  }, []);

  const release = useCallback(() => {
    requesting.current = false;
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    const current = recorder.current;
    recorder.current = null;
    if (current) {
      current.ondataavailable = null;
      current.onstop = null;
      current.onerror = null;
      if (current.state !== "inactive") {
        try {
          current.stop();
        } catch {
          /* Device already stopped. */
        }
      }
    }
    const tracks = stream.current?.getTracks() ?? [];
    stream.current = null;
    tracks.forEach((track) => {
      track.onended = null;
      track.stop();
    });
    const context = audio.current;
    audio.current = null;
    const restoreSession = session.current;
    session.current = null;
    const closed =
      context && context.state !== "closed"
        ? context.close().catch(() => {})
        : Promise.resolve();
    closing.current = Promise.all([closing.current, closed]).then(() => {
      restoreSession?.();
    });
    return closing.current;
  }, []);

  const reset = useCallback(() => {
    invalidate();
    void release();
    finishing.current = false;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setAudioUrl(null);
    setSeconds(0);
    setDuration(0);
    setPeaks([]);
    levels.current = [];
    stoppedAt.current = null;
    setLevel(0);
    setError("");
    setStatus("idle");
  }, [release, invalidate]);

  const stop = useCallback(() => {
    const current = recorder.current;
    if (!current || current.state !== "recording") return;
    setStatus("stopping");
    stoppedAt.current = performance.now();
    setLevel(0);
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    current.stop();
    // End microphone access immediately; onstop assembles the final audio.
    stream.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
  }, []);

  const start = useCallback(async () => {
    if (recorder.current || requesting.current || finishing.current) return;
    reset();
    const attempt = sequence.current;
    const fail = (message: string) => {
      if (sequence.current !== attempt) return;
      release();
      setLevel(0);
      setError(message);
      setStatus("error");
    };
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      fail(
        "Perekam belum tersedia di browser ini. Gunakan HTTPS dan browser terbaru, atau lanjutkan lewat teks.",
      );
      return;
    }
    setStatus("requesting");
    requesting.current = true;
    await closing.current;
    if (sequence.current !== attempt || document.hidden) return;
    session.current = acquireVoiceAudioSession("play-and-record");
    // Start the level meter only after the previous capture has released resources.
    try {
      if (typeof AudioContext !== "undefined") {
        audio.current = new AudioContext();
        void audio.current.resume().catch(() => {});
      }
    } catch {
      /* Recording still works without the level meter. */
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (sequence.current !== attempt || document.hidden) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      requesting.current = false;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const current = new MediaRecorder(
        media,
        mimeType ? { mimeType } : undefined,
      );
      recorder.current = current;
      const chunks: Blob[] = [];
      let bytes = 0;
      current.ondataavailable = (event) => {
        if (sequence.current !== attempt || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > MAX_BYTES) {
          fail("Rekaman terlalu besar. Coba rekaman yang lebih singkat, ya.");
          return;
        }
        chunks.push(event.data);
      };
      current.onerror = () =>
        fail("Rekaman terputus. Periksa mikrofon lalu coba lagi, ya.");
      current.onstop = async () => {
        if (sequence.current !== attempt) return;
        finishing.current = true;
        const blob = new Blob(chunks, {
          type: current.mimeType || chunks[0]?.type || "audio/webm",
        });
        const elapsed = Math.min(
          MAX_SECONDS,
          Math.max(
            0.01,
            ((stoppedAt.current ?? performance.now()) - beganAt.current) / 1000,
          ),
        );
        // Do not offer Play while the capture context still owns audio resources.
        await release();
        if (sequence.current !== attempt) return;
        finishing.current = false;
        if (document.hidden) {
          reset();
          return;
        }
        if (!blob.size) {
          fail("Suara belum berhasil direkam. Coba sekali lagi, ya.");
          return;
        }
        url.current = URL.createObjectURL(blob);
        setDuration(elapsed);
        setSeconds(Math.floor(elapsed));
        setPeaks([...levels.current]);
        setAudioUrl(url.current);
        setLevel(0);
        setStatus("ready");
      };
      media.getAudioTracks().forEach((track) => {
        track.onended = stop;
      });
      let analyser: AnalyserNode | undefined;
      try {
        if (audio.current) {
          analyser = audio.current.createAnalyser();
          analyser.fftSize = 256;
          audio.current.createMediaStreamSource(media).connect(analyser);
        }
      } catch {
        /* Optional level meter; never block recording. */
      }
      const data = new Uint8Array(256);
      const began = performance.now();
      beganAt.current = began;
      current.start(250);
      setStatus("recording");
      ticker.current = setInterval(() => {
        if (sequence.current !== attempt) return;
        const elapsed = Math.min(
          MAX_SECONDS,
          Math.floor((performance.now() - began) / 1000),
        );
        setSeconds(elapsed);
        if (analyser) {
          analyser.getByteTimeDomainData(data);
          let energy = 0;
          for (const sample of data) energy += ((sample - 128) / 128) ** 2;
          const volume = Math.min(1, Math.sqrt(energy / data.length) * 5);
          setLevel(volume);
          if (levels.current.length < 600) levels.current.push(volume);
        }
        if (elapsed >= MAX_SECONDS) stop();
      }, 100);
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      fail(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Akses mikrofon belum diizinkan. Izinkan mikrofon melalui pengaturan situs, lalu coba lagi."
          : name === "NotFoundError"
            ? "Mikrofon tidak ditemukan. Sambungkan mikrofon atau lanjutkan lewat teks."
            : "Mikrofon belum bisa digunakan. Tutup aplikasi lain yang memakainya lalu coba lagi.",
      );
    }
  }, [release, reset, stop]);

  useEffect(() => {
    const hidden = () => {
      if (
        document.hidden &&
        (requesting.current ||
          recorder.current ||
          stream.current ||
          audio.current ||
          finishing.current ||
          ticker.current)
      )
        reset();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      invalidate();
      document.removeEventListener("visibilitychange", hidden);
      release();
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, [release, reset, invalidate]);

  return {
    status,
    seconds,
    duration,
    peaks,
    level,
    error,
    audioUrl,
    start,
    stop,
    reset,
  };
}
