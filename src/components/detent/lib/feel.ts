// Detent VoiceNote, Copyright (c) 2026 Detent. MIT; see ../../LICENSE (or ancestor LICENSE).
// Adapted for Cashly; source: https://detentui.com/r/voicenote
export const tap = () => {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("detent:tap"));
};

let keyed = true;
if (typeof window !== "undefined") {
  window.addEventListener("keydown", () => void (keyed = true), true);
  window.addEventListener("pointerdown", () => void (keyed = false), true);
}
export const byKey = () => keyed;
