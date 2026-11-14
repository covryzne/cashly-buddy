"use client";
import { useEffect, useRef, useState } from "react";

// One visible Dialog, with explicit parent history for every nested flow.
export function useModalStack<T>() {
  const [history, setHistory] = useState<
    Array<{ panel: T; returnKey?: string }>
  >([]);
  const rootTrigger = useRef<HTMLElement | null>(null);
  const focusTarget = useRef<{
    element?: HTMLElement | null;
    selector?: string;
  } | null>(null);
  useEffect(() => {
    const target = focusTarget.current;
    focusTarget.current = null;
    if (!target) return;
    const frame = requestAnimationFrame(() => {
      const element =
        target.element ??
        (target.selector
          ? document.querySelector<HTMLElement>(target.selector)
          : null);
      if (element?.isConnected) element.focus();
      else
        document
          .querySelector<HTMLElement>(
            'dialog[open] [aria-label="Tutup dialog"]',
          )
          ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [history]);
  return {
    panel: history.at(-1)?.panel ?? null,
    canGoBack: history.length > 1,
    open(panel: T) {
      rootTrigger.current = document.activeElement as HTMLElement | null;
      setHistory([{ panel }]);
    },
    push(panel: T) {
      const returnKey =
        document.activeElement
          ?.closest("[data-modal-focus-key]")
          ?.getAttribute("data-modal-focus-key") ?? undefined;
      focusTarget.current = { selector: 'dialog[open] [aria-label="Kembali"]' };
      setHistory((previous) => [...previous, { panel, returnKey }]);
    },
    back() {
      if (history.length < 2) return;
      const key = history.at(-1)?.returnKey;
      focusTarget.current = {
        selector: key
          ? `dialog[open] [data-modal-focus-key="${CSS.escape(key)}"]`
          : 'dialog[open] [aria-label="Tutup dialog"]',
      };
      setHistory((previous) => previous.slice(0, -1));
    },
    close() {
      focusTarget.current = { element: rootTrigger.current };
      setHistory([]);
    },
  };
}
