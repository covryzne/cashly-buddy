"use client";

import Image from "next/image";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import SplineMascot from "./spline-mascot";
import { AssetLoader } from "@/components/shared/asset-loader";
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function MascotStageRenderer({
  stage,
  onGreeting,
}: {
  stage: number;
  onGreeting: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const greetingRef = useRef<(() => void) | null>(null);
  const [eligible, setEligible] = useState(false);
  const [phase, setPhase] = useState<"poster" | "loading" | "ready" | "failed">(
    "loading",
  );
  const [imageFailed, setImageFailed] = useState(false);
  const onReady = useCallback((greet: () => void) => {
    greetingRef.current = greet;
    setPhase("ready");
  }, []);
  const onFailure = useCallback(() => setPhase("failed"), []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      greetingRef.current = null;
      const shouldLoad = !motion.matches && navigator.onLine;
      setEligible(shouldLoad);
      setPhase(shouldLoad ? "loading" : "poster");
    }
    update();
    motion.addEventListener("change", update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      motion.removeEventListener("change", update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const timeout = window.setTimeout(() => setPhase("failed"), 20000);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  return (
    <button
      ref={ref}
      className="mascot-button"
      onClick={() => {
        if (phase === "ready") greetingRef.current?.();
        onGreeting();
      }}
      aria-label="Sapa Mochi"
      data-unlocked-stage={stage}
      data-scene-state={phase}
    >
      {(phase === "poster" || phase === "failed") &&
        (imageFailed ? (
          <span className="mascot-fallback" aria-hidden="true">
            ☺
          </span>
        ) : (
          <Image
            src="/mascot/mochi-crown-transparent.webp"
            alt="Mochi ungu, fallback mascot"
            width={160}
            height={160}
            loading="eager"
            onError={() => setImageFailed(true)}
          />
        ))}
      {phase === "loading" && (
        <div
          className="mascot-loading"
          role="status"
          aria-label="Memuat Mochi 3D"
        >
          <AssetLoader size={28} />
          <span>Memuat Mochi...</span>
        </div>
      )}
      {eligible && phase !== "failed" && (
        <span
          className={`spline-mascot ${phase === "ready" ? "is-ready" : ""}`}
          aria-hidden="true"
        >
          <SceneBoundary onFailure={onFailure}>
            <SplineMascot onReady={onReady} onFailure={onFailure} />
          </SceneBoundary>
        </span>
      )}
    </button>
  );
}
