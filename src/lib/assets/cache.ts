let registration: Promise<ServiceWorkerRegistration | null> | undefined;

function ownsController() {
  const controller = navigator.serviceWorker.controller;
  return (
    controller && new URL(controller.scriptURL).pathname === "/asset-worker.js"
  );
}

/** Bound startup waiting; ordinary fetch remains available without a worker. */
export function prepareAssetCache(signal?: AbortSignal): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !navigator.serviceWorker ||
    signal?.aborted
  )
    return Promise.resolve(false);

  const registered = (registration ??= Promise.resolve()
    .then(() =>
      navigator.serviceWorker.register("/asset-worker.js", {
        scope: "/",
        updateViaCache: "none",
      }),
    )
    .catch(() => null));

  return new Promise((resolve) => {
    let finished = false;
    const finish = (ready: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", check);
      signal?.removeEventListener("abort", abort);
      resolve(ready);
    };
    const check = () => {
      if (ownsController()) finish(true);
    };
    const abort = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), 3000);
    navigator.serviceWorker.addEventListener("controllerchange", check);
    signal?.addEventListener("abort", abort, { once: true });
    check();
    void registered.then((worker) => {
      if (!worker) finish(false);
      else check();
    });
  });
}

export async function preloadLoginAssets() {
  if (!(await prepareAssetCache())) return;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  navigator.serviceWorker.controller?.postMessage({
    type: "WARM_PUBLIC_ASSETS",
    includeScene:
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !connection?.saveData,
    images: Array.from(
      document.images,
      (image) => image.currentSrc || image.src,
    ),
  });
}
