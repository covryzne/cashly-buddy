// Copyright (c) 2026 Detent. MIT; see ../../LICENSE.
// https://detentui.com/r/voicenote — adapted for Cashly media, tokens and accessibility.
"use client";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent, Ref } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { ChevronDown, Pause, Play } from "../../icons";
import { tap } from "../../lib/feel";
import { ease, press, spring } from "../../lib/motion";
import { RollingText } from "../../ui/RollingText";
import { acquireVoiceAudioSession } from "@/lib/voice-audio-session";
export type SpokenWord = { word: string; at: number };
export type VoiceNoteHandle = {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  speed(rate: number): void;
  transcript(open: boolean): void;
};
export type VoiceNoteProps = {
  words: SpokenWord[];
  duration: number;
  src?: string;
  peaks?: number[];
  defaultTranscript?: boolean;
  transcriptText?: string;
  ref?: Ref<VoiceNoteHandle>;
};
const COLS = 38,
  ROWS = 7,
  RATES = [1, 1.5, 2];
const finite = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;
const time = (value: number) => {
  const s = Math.max(0, Number.isFinite(value) ? value : 0);
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
export function VoiceNote(props: VoiceNoteProps) {
  return (
    <MotionConfig reducedMotion="user">
      <VoiceNotePlayer key={props.src ?? "no-source"} {...props} />
    </MotionConfig>
  );
}
function VoiceNotePlayer({
  words,
  duration: suppliedDuration,
  src,
  peaks: given,
  defaultTranscript = true,
  transcriptText,
  ref,
}: VoiceNoteProps) {
  const [t, setT] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [rate, setRate] = useState(1);
  const [reading, setReading] = useState(defaultTranscript);
  const [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  const session = useRef<(() => void) | null>(null);
  const wave = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false),
    alive = useRef(true),
    playAttempt = useRef(0);
  const transcriptId = useId(),
    reduce = useReducedMotion();
  const duration = finite(mediaDuration) || finite(suppliedDuration);
  const enabled = !!src && duration > 0;
  const hasTranscript = !!transcriptText?.trim() || words.length > 0;
  const peaks = useMemo(
    () =>
      Array.from({ length: COLS }, (_, column) => {
        // Use real recording levels; never synthesize a waveform from manual words.
        const value = given?.length
          ? given[Math.floor((column / COLS) * given.length)]
          : 0;
        return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
      }),
    [given],
  );
  const releaseSession = useCallback(() => {
    session.current?.();
    session.current = null;
  }, []);
  const pause = useCallback(() => {
    ++playAttempt.current;
    audio.current?.pause();
    setPlaying(false);
    setStarting(false);
    releaseSession();
  }, [releaseSession]);
  const invalidate = useCallback(() => {
    ++playAttempt.current;
  }, []);
  useEffect(() => {
    alive.current = true;
    const element = audio.current;
    const hidden = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      alive.current = false;
      invalidate();
      document.removeEventListener("visibilitychange", hidden);
      element?.pause();
      releaseSession();
    };
  }, [pause, invalidate, releaseSession]);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const frame = () => {
      if (!scrubbing.current && audio.current)
        setT(Math.min(duration, Math.max(0, audio.current.currentTime)));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);
  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);
  function play() {
    const element = audio.current;
    if (!enabled || !element || document.hidden || starting) return;
    const attempt = ++playAttempt.current;
    setError("");
    if (element.ended || t >= duration) {
      element.currentTime = 0;
      setT(0);
    }
    session.current ??= acquireVoiceAudioSession("playback");
    setStarting(true);
    // Keep play() in the tap handler: awaiting media/session work here loses
    // user activation on mobile. Capture has already finished before mounting.
    void element.play().catch(() => {
      if (alive.current && playAttempt.current === attempt) {
        setPlaying(false);
        setStarting(false);
        releaseSession();
        setError("Audio belum bisa diputar. Coba lagi atau rekam ulang, ya.");
      }
    });
  }
  function seek(seconds: number) {
    if (!enabled || !audio.current || !Number.isFinite(seconds)) return;
    const to = Math.max(0, Math.min(duration, seconds));
    try {
      audio.current.currentTime = to;
      setT(to);
    } catch {
      /* Metadata not ready yet. */
    }
  }
  function speed(value: number) {
    if (Number.isFinite(value) && value >= 0.25 && value <= 4) setRate(value);
  }
  useImperativeHandle(ref, () => ({
    play,
    pause,
    seek,
    speed,
    transcript: setReading,
  }));
  function scrubTo(event: PointerEvent) {
    const bounds = wave.current?.getBoundingClientRect();
    if (bounds?.width)
      seek(((event.clientX - bounds.left) / bounds.width) * duration);
  }
  const played = duration ? t / duration : 0;
  let spoken = -1;
  words.forEach((word, index) => {
    if (word.at <= t + 0.05) spoken = index;
  });
  return (
    <div
      data-slot="voice-note"
      className="detent-voice-note"
      role="group"
      aria-label="Rekaman pengeluaran"
    >
      {src && (
        <audio
          ref={audio}
          src={src}
          preload="auto"
          aria-label="Putar rekaman pengeluaran"
          hidden
          onLoadedMetadata={(event) =>
            setMediaDuration(finite(event.currentTarget.duration))
          }
          onDurationChange={(event) =>
            setMediaDuration(finite(event.currentTarget.duration))
          }
          onTimeUpdate={(event) => {
            if (!scrubbing.current)
              setT(
                Math.min(
                  duration,
                  Math.max(0, event.currentTarget.currentTime),
                ),
              );
          }}
          onPlaying={() => {
            setStarting(false);
            setPlaying(true);
          }}
          onPause={() => {
            setStarting(false);
            setPlaying(false);
            releaseSession();
          }}
          onEnded={() => {
            setStarting(false);
            setPlaying(false);
            releaseSession();
            setT(duration);
          }}
          onError={() => {
            setStarting(false);
            setPlaying(false);
            releaseSession();
            setError("Rekaman tidak bisa dibaca. Coba rekam ulang, ya.");
          }}
        />
      )}
      <div className="detent-voice-main">
        <motion.button
          type="button"
          className="detent-voice-play"
          disabled={!enabled || starting}
          aria-busy={starting}
          aria-label={playing ? "Jeda rekaman" : "Putar rekaman"}
          whileTap={reduce ? undefined : press}
          onPointerDown={tap}
          onClick={playing ? pause : play}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={playing ? "pause" : "play"}
              className="flex"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
              transition={reduce ? { duration: 0 } : spring.snappy}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <div
          ref={wave}
          role="slider"
          tabIndex={enabled ? 0 : -1}
          aria-disabled={!enabled}
          aria-label="Posisi rekaman"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.min(t, duration)}
          aria-valuetext={`${time(t)} dari ${time(duration)}`}
          className="detent-voice-wave"
          onKeyDown={(event) => {
            if (!enabled) return;
            if (event.key === "ArrowRight") seek(t + 2);
            else if (event.key === "ArrowLeft") seek(t - 2);
            else if (event.key === "Home") seek(0);
            else if (event.key === "End") seek(duration);
            else return;
            event.preventDefault();
          }}
          onPointerDown={(event) => {
            if (!enabled) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            scrubbing.current = true;
            scrubTo(event);
          }}
          onPointerMove={(event) => {
            if (scrubbing.current) scrubTo(event);
          }}
          onPointerUp={() => {
            scrubbing.current = false;
          }}
          onPointerCancel={() => {
            scrubbing.current = false;
          }}
          onLostPointerCapture={() => {
            scrubbing.current = false;
          }}
        >
          {peaks.flatMap((peak, column) => {
            const reach =
              peak < 0.08 ? 0 : peak < 0.35 ? 1 : peak < 0.65 ? 2 : 3;
            const done = (column + 0.5) / COLS <= played;
            return Array.from({ length: ROWS }, (_, row) => (
              <span
                key={`${column}-${row}`}
                aria-hidden="true"
                style={{
                  opacity:
                    Math.abs(row - 3) <= reach ? (done ? 1 : 0.42) : 0.08,
                }}
              />
            ));
          })}
        </div>
        <p className="detent-voice-time">
          <RollingText text={time(t)} still={!!reduce} />
          <span> / {time(duration)}</span>
        </p>
        <motion.button
          className="detent-voice-speed"
          type="button"
          disabled={!enabled}
          whileTap={reduce ? undefined : press}
          onPointerDown={tap}
          onClick={() => speed(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
          aria-label={`Kecepatan ${rate} kali`}
        >
          <RollingText text={`${rate}×`} still={!!reduce} />
        </motion.button>
      </div>
      <div className="detent-voice-actions">
        {hasTranscript && (
          <button
            type="button"
            onClick={() => setReading((open) => !open)}
            aria-expanded={reading}
            aria-controls={transcriptId}
          >
            Transkrip
            <motion.span
              className="flex"
              animate={{ rotate: reading ? 180 : 0 }}
              transition={reduce ? { duration: 0 } : spring.snappy}
            >
              <ChevronDown size={13} />
            </motion.span>
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {reading && hasTranscript && (
          <motion.div
            id={transcriptId}
            className="detent-voice-transcript"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    height: spring.smooth,
                    opacity: { duration: 0.2, ease: ease.out },
                  }
            }
          >
            <p>
              {transcriptText ??
                words.map((word, index) => (
                  <span
                    key={index}
                    className={index <= spoken ? "is-spoken" : ""}
                  >
                    {index > 0 && " "}
                    {word.word}
                  </span>
                ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <p className="detent-voice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
