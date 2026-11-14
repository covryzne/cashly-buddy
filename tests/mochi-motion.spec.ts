import { test, expect } from '@playwright/test';
import type { Application } from '@splinetool/runtime';
import { createMochiMotion } from '../src/lib/mochi-motion';

test('Halo mengangkat pivot tangan lalu kembali netral; dispose menghentikan frame', () => {
  const objects = new Map(['Little Cashly Stage 1','Cashly Right Shoulder Pivot','Little Cashly Arm L'].map(name => [name, { position: {x:0,y:0,z:0}, scale:{x:1,y:1,z:1}, rotation:{x:0,y:0,z:0} }]));
  let nextFrame: FrameRequestCallback | undefined;
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  let cancelled = false;
  globalThis.requestAnimationFrame = callback => { nextFrame = callback; return 1; };
  globalThis.cancelAnimationFrame = () => { cancelled = true; };
  try {
    const app = { findObjectByName: (name: string) => objects.get(name), requestRender() {} } as unknown as Application;
    const start = performance.now();
    const motion = createMochiMotion(app)!;
    nextFrame!(start + 20);
    expect(objects.get('Cashly Right Shoulder Pivot')!.rotation.z).toBe(0);
    motion.greet();
    nextFrame!(performance.now() + 800);
    expect(objects.get('Cashly Right Shoulder Pivot')!.rotation.z).toBeGreaterThan(1.4);
    nextFrame!(performance.now() + 3200);
    expect(objects.get('Cashly Right Shoulder Pivot')!.rotation.z).toBe(0);
    motion.dispose();
    expect(cancelled).toBe(true);
  } finally { globalThis.requestAnimationFrame = originalRequest; globalThis.cancelAnimationFrame = originalCancel; }
});
