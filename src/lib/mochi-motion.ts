import type { Application } from "@splinetool/runtime";

// Ported from the animation script embedded in the supplied scene. The runtime
// uses radians; the authored HTML bridge used degrees and async updateObject.
export function createMochiMotion(app: Application) {
  const root = app.findObjectByName("Little Cashly Stage 1");
  const shoulder = app.findObjectByName("Cashly Right Shoulder Pivot");
  const left = app.findObjectByName("Little Cashly Arm L");
  if (!root || !shoulder || !left) return null;
  const base = {
    y: root.position.y,
    x: root.scale.x,
    sy: root.scale.y,
    z: root.scale.z,
    rz: root.rotation.z,
    ry: root.rotation.y,
    shoulder: shoulder.rotation.z,
    left: left.rotation.z,
  };
  const eyes = ["L", "R"].map((side) => {
    const eye = app.findObjectByName(`Little Cashly Eye ${side}`);
    const glint = app.findObjectByName(`Little Cashly Eye Glint ${side}`);
    return eye && glint
      ? {
          eye,
          glint,
          sy: eye.scale.y,
          gy: glint.position.y,
          gsy: glint.scale.y,
          ey: eye.position.y,
        }
      : null;
  });
  const radians = Math.PI / 180;
  const start = performance.now();
  let helloAt = -Infinity;
  let frame = 0;
  let paused = false;
  let stopped = false;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const smooth = (value: number) => {
    const v = clamp(value);
    return v * v * (3 - 2 * v);
  };
  const pulse = (time: number, offset: number) => {
    const p = (time - offset) / 0.3;
    return p < 0 || p > 1 ? 0 : Math.sin(Math.PI * p) ** 2;
  };
  function tick(now: number) {
    if (stopped || paused) return;
    const t = (now - start) / 1000;
    const h = t - helloAt;
    const envelope = Number.isFinite(h)
      ? smooth(h / 0.4) * (1 - smooth((h - 2.25) / 0.55))
      : 0;
    const wave = envelope
      ? envelope * (108 + 19 * Math.sin((h - 0.4) * Math.PI * 3.5))
      : 0;
    const breathe = Math.sin(t * 1.45) * 0.009;
    root!.position.y = base.y + breathe * 120;
    root!.scale.x = base.x * (1 - breathe * 0.35);
    root!.scale.y = base.sy * (1 + breathe);
    root!.scale.z = base.z;
    root!.rotation.z =
      base.rz + (Math.sin(t * 0.92) * 1.1 - envelope * 2.5) * radians;
    root!.rotation.y = base.ry + Math.sin(t * 0.65) * 1.5 * radians;
    shoulder!.rotation.z = base.shoulder + wave * radians;
    left!.rotation.z = base.left + Math.sin(t * 1.2 + 0.6) * 2 * radians;
    const blink = Math.max(pulse(t % 5.4, 3.6), pulse(h, 0.06), pulse(h, 1.62));
    const open = 1 - 0.94 * blink;
    for (const part of eyes)
      if (part) {
        part.eye.scale.y = part.sy * open;
        part.glint.visible = blink < 0.55;
        part.glint.position.y = part.ey + (part.gy - part.ey) * open;
        part.glint.scale.y = part.gsy * open;
      }
    app.requestRender();
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return {
    greet() {
      const now = (performance.now() - start) / 1000;
      if (now - helloAt >= 2.9) helloAt = now;
    },
    pause() {
      paused = true;
      cancelAnimationFrame(frame);
    },
    resume() {
      if (paused && !stopped) {
        paused = false;
        frame = requestAnimationFrame(tick);
      }
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
    },
  };
}
