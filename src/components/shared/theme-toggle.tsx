"use client";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
type Theme = "system" | "light" | "dark";
const subscribe = (notify: () => void) => {
  window.addEventListener("cashly-theme", notify);
  return () => window.removeEventListener("cashly-theme", notify);
};
function readTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "system" as Theme,
  );
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  function changeTheme() {
    const next = ({ system: "light", light: "dark", dark: "system" } as const)[
      theme
    ];
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("cashly-theme", next);
    } catch {
      /* Optional persistence. */
    }
    window.dispatchEvent(new Event("cashly-theme"));
  }
  return (
    <button
      className="icon-button"
      onClick={changeTheme}
      aria-label={`Tema ${theme === "system" ? "sistem" : theme === "light" ? "terang" : "gelap"}. Ganti tema`}
      title="Ganti tema"
    >
      <Icon size={21} />
    </button>
  );
}
