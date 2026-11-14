"use client";

import { useEffect, useRef } from "react";
import { Application } from "@splinetool/runtime";
import { createMochiMotion } from "@/lib/mochi-motion";
import { prepareAssetCache } from "@/lib/assets/cache";

export const MOCHI_SCENE =
  "https://prod.spline.design/R4tRoaLYG0dA8fQD/scene.splinecode";

export default function SplineMascot({
  onReady,
  onFailure,
}: {
  onReady: (greet: () => void) => void;
  onFailure: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = new AbortController();
    let disposed = false;
    let visible = true;
    let app: Application | undefined;
    let motion: ReturnType<typeof createMochiMotion> = null;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) {
        app?.play();
        motion?.resume();
      } else {
        motion?.pause();
        app?.stop();
      }
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    async function loadScene() {
      try {
        await prepareAssetCache(controller.signal);
        if (disposed) return;
        app = new Application(canvas!, {
          renderOnDemand: true,
          htmlContentMode: "none",
        });
        const response = await fetch(MOCHI_SCENE, {
          signal: controller.signal,
          // The asset worker serves its versioned cache first. Without it,
          // revalidate the CDN response rather than keeping an old export.
          cache: "no-cache",
        });
        if (!response.ok)
          throw new Error(`Scene download failed: ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (disposed) return;
        // This export contains legacy animation actions with missing state refs.
        // Render its model without those handlers; the local controller owns halo.
        await app.start(bytes, { interactive: false });
        if (disposed) return;
        motion = createMochiMotion(app);
        if (!motion) throw new Error("Mochi animation objects are unavailable");
        if (!visible) {
          motion.pause();
          app.stop();
        }
        onReady(() => motion?.greet());
      } catch {
        if (!disposed) {
          motion?.dispose();
          app?.dispose();
          onFailure();
        }
      }
    }
    void loadScene();
    return () => {
      disposed = true;
      controller.abort();
      observer.disconnect();
      motion?.dispose();
      app?.dispose();
    };
  }, [onReady, onFailure]);
  return (
    <div ref={wrapperRef} className="spline-runtime">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
