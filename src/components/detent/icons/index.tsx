// Detent VoiceNote, Copyright (c) 2026 Detent. MIT; see ../../LICENSE (or ancestor LICENSE).
// Adapted for Cashly; source: https://detentui.com/r/voicenote
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Close = (p: P) => (
  <Svg {...p}>
    <path d="M7 7l10 10M17 7 7 17" />
  </Svg>
);

export const Check = (p: P) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const Plus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Bin = (p: P) => (
  <Svg {...p}>
    <rect
      x="4"
      y="4.5"
      width="16"
      height="3.6"
      rx="1.8"
      fill="currentColor"
      stroke="none"
    />
    <path d="M9.5 4.5V3.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v.7" />
    <path d="M6 10.5l.8 8.4A2.2 2.2 0 0 0 9 21h6a2.2 2.2 0 0 0 2.2-2.1l.8-8.4" />
    <path d="M10.3 13v4.5M13.7 13v4.5" />
  </Svg>
);

export const Undo = (p: P) => (
  <Svg {...p}>
    <path d="M9 9h6.5a4.5 4.5 0 0 1 0 9H10" />
    <path d="M9.6 4.6 4.6 9l5 4.4z" fill="currentColor" />
  </Svg>
);

export const Pause = (p: P) => (
  <Svg {...p}>
    <rect
      x="6"
      y="5"
      width="4"
      height="14"
      rx="1.6"
      fill="currentColor"
      stroke="none"
    />
    <rect
      x="14"
      y="5"
      width="4"
      height="14"
      rx="1.6"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Upload = (p: P) => (
  <Svg {...p}>
    <path d="M4 14.5v2.3A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2v-2.3" />
    <path d="M12 15V7" />
    <path d="M12 3.2 7.6 8.2h8.8z" fill="currentColor" />
  </Svg>
);

export const FilePage = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 3H8a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8.5" />
    <path d="M13.5 3v3.5a2 2 0 0 0 2 2H19z" fill="currentColor" />
  </Svg>
);

export const Picture = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="4" />
    <path
      d="M3.8 16.5 9 11.6a1.5 1.5 0 0 1 2.1 0l3.2 3 1.6-1.5a1.5 1.5 0 0 1 2.1 0l2.2 2.1V16a3.5 3.5 0 0 1-3.5 3.5H8A4 4 0 0 1 3.8 16.5z"
      fill="currentColor"
      stroke="none"
    />
    <circle cx="15.5" cy="8.8" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const Film = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="4" />
    <path
      d="M10.2 9.2v5.6a.7.7 0 0 0 1 .6l4.4-2.8a.7.7 0 0 0 0-1.2l-4.4-2.8a.7.7 0 0 0-1 .6z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Bubble = (p: P) => (
  <Svg {...p}>
    <path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-2-.1-2.9-.4L5 19.5l1.1-3.6C4.6 14.6 3.5 12.9 3.5 11c0-3.9 3.8-7 8.5-7z" />
    <circle cx="8.6" cy="11" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="12" cy="11" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="11" r="1.15" fill="currentColor" stroke="none" />
  </Svg>
);

export const Card = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="3.5" />
    <rect
      x="3"
      y="8.6"
      width="18"
      height="3"
      fill="currentColor"
      stroke="none"
    />
    <path d="M7 15h3" />
  </Svg>
);

export const Bell = (p: P) => (
  <Svg {...p}>
    <path d="M6 15.5V11a6 6 0 1 1 12 0v4.5l1.5 2H4.5z" />
    <path d="M9.6 19.5a2.6 2.6 0 0 0 4.8 0z" fill="currentColor" />
  </Svg>
);

export const Ship = (p: P) => (
  <Svg {...p}>
    <path d="M5 20h14" />
    <path d="M12 16V9" />
    <path d="M12 3.5 7 9.2h10z" fill="currentColor" />
  </Svg>
);

export const Mention = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
    <path d="M15.4 12v1.4a2.6 2.6 0 0 0 5.1.7A8.5 8.5 0 1 0 16 19.5" />
  </Svg>
);

export const Calendar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
    <path
      d="M3.5 9A4 4 0 0 1 7.5 5h9a4 4 0 0 1 4 4v1H3.5z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M8 3v3M16 3v3" />
  </Svg>
);

export const ChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  </Svg>
);

export const ArrowUpRight = (p: P) => (
  <Svg {...p}>
    <path d="M8 16 16 8" />
    <path d="M9.5 6.8h7.7v7.7z" fill="currentColor" />
  </Svg>
);

export const Sun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const r = (a * Math.PI) / 180;
      return (
        <circle
          key={a}
          cx={12 + Math.cos(r) * 8.4}
          cy={12 + Math.sin(r) * 8.4}
          r="1.1"
          fill="currentColor"
          stroke="none"
        />
      );
    })}
  </Svg>
);

export const Moon = (p: P) => (
  <Svg {...p}>
    <path
      d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Expand = (p: P) => (
  <Svg {...p}>
    <path d="M14 4h6v6M10 20H4v-6" />
    <path d="M20 4l-6 6M4 20l6-6" />
  </Svg>
);

export const Inspect = (p: P) => (
  <Svg {...p}>
    <path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M4 15v2.5A2.5 2.5 0 0 0 6.5 20H9" />
    <path
      d="M13.2 13.2l7.3 2.5-3.1 1.3-1.3 3.1z"
      fill="currentColor"
      strokeWidth={1.5}
    />
  </Svg>
);

export const Folder = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 9.5V17a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-6.5a3 3 0 0 0-3-3h-6" />
    <path
      d="M3.5 7A2.5 2.5 0 0 1 6 4.5h3.2a2 2 0 0 1 1.6.8l1.5 2.2H3.5z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Copy = (p: P) => (
  <Svg {...p}>
    <rect
      x="4"
      y="4"
      width="11"
      height="11"
      rx="3"
      fill="currentColor"
      stroke="none"
    />
    <rect
      x="9"
      y="9"
      width="11"
      height="11"
      rx="3"
      fill="var(--icon-cutout, white)"
    />
  </Svg>
);

export const Cookie = (p: P) => (
  <Svg {...p}>
    <path d="M20.6 12.6a8.6 8.6 0 1 1-9.2-9.2 3 3 0 0 0 3.6 3.6 3 3 0 0 0 5.6 5.6z" />
    <circle cx="9.2" cy="10.4" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="15.3" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8.8" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const Clock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2v5.2l3.4 2.1" strokeWidth={2.4} />
  </Svg>
);

export const ArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H7" />
    <path d="M10.5 6.5 4.5 12l6 5.5z" fill="currentColor" />
  </Svg>
);

export const Mail = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3.5" />
    <path
      d="M4.4 7.6A3.5 3.5 0 0 1 7 5.5h10a3.5 3.5 0 0 1 2.6 2.1L12 13z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const ArrowUp = (p: P) => (
  <Svg {...p}>
    <path d="M12 20v-9" />
    <path d="M12 3.8 6.6 10.2h10.8z" fill="currentColor" />
  </Svg>
);

export const Stop = (p: P) => (
  <Svg {...p}>
    <rect
      x="6.5"
      y="6.5"
      width="11"
      height="11"
      rx="3"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Bolt = (p: P) => (
  <Svg {...p}>
    <path
      d="M13.2 3.2 5.8 13h5.6l-.6 7.8 7.4-9.8h-5.6z"
      fill="currentColor"
      strokeWidth={1.6}
    />
  </Svg>
);

export const Orbit = (p: P) => (
  <Svg {...p}>
    <path d="M18.06 8.5A7 7 0 1 1 15.5 5.94" />
    <circle cx="16.95" cy="7.05" r="2.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const Search = (p: P) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path
      d="M14.9 17.1a1.55 1.55 0 0 1 2.2-2.2l3 3a1.55 1.55 0 0 1-2.2 2.2z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Minus = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const Chevrons = (p: P) => (
  <Svg {...p}>
    <path d="M8 9.5 12 5.5l4 4M8 14.5l4 4 4-4" />
  </Svg>
);

export const Pencil = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 5.5 18.5 9.5 9 19H5v-4z" />
    <path
      d="M16.2 3.8a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8l-1.4 1.4-4-4z"
      fill="currentColor"
    />
  </Svg>
);

export const ArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h12" />
    <path d="M13.5 6.5 19.5 12l-6 5.5z" fill="currentColor" />
  </Svg>
);

export const Cup = (p: P) => (
  <Svg {...p}>
    <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
    <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
    <path d="M5 8h11v3H5z" fill="currentColor" stroke="none" />
  </Svg>
);

export const Bag = (p: P) => (
  <Svg {...p}>
    <path d="M5.5 8h13l-1 11.2a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8z" />
    <path d="M9 11V7a3 3 0 0 1 6 0v4" />
    <path d="M5.6 8h12.8l-.25 3H5.85z" fill="currentColor" stroke="none" />
  </Svg>
);

export const Note = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="3" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const Plane = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 3.5 3.5 10.6l6.3 2.9 2.9 6.3z" />
    <path d="M20.5 3.5 9.8 13.5l2.9 6.3z" fill="currentColor" />
  </Svg>
);

export const Building = (p: P) => (
  <Svg {...p}>
    <path d="M5 21V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15M16 10h2a2 2 0 0 1 2 2v9M3 21h18" />
    <rect
      x="8.5"
      y="15.5"
      width="4"
      height="5.5"
      rx="1"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const FolderOpen = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 16.5V7A2.5 2.5 0 0 1 6 4.5h3.2a2 2 0 0 1 1.6.8l1.5 2.2H17a2.5 2.5 0 0 1 2.5 2.5v1" />
    <path
      d="M3.5 7A2.5 2.5 0 0 1 6 4.5h3.2a2 2 0 0 1 1.6.8l1.5 2.2H3.5z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M5.6 11.5h15a1 1 0 0 1 .96 1.27l-1.55 5.6A2.2 2.2 0 0 1 17.9 20H6.1a2.6 2.6 0 0 1-2.6-2.6v-3.8a2.1 2.1 0 0 1 2.1-2.1z" />
  </Svg>
);

export const Code = (p: P) => (
  <Svg {...p}>
    <path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5" />
    <path
      d="M13.2 4.6a1 1 0 0 1 1.9.6l-4.3 14.2a1 1 0 0 1-1.9-.6z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Wrench = (p: P) => (
  <Svg {...p}>
    <path d="M15.4 3.6a4.6 4.6 0 0 0-4.3 6.1l-6.6 6.6a2.2 2.2 0 1 0 3.1 3.1l6.6-6.6a4.6 4.6 0 0 0 6.1-4.3l-2.9 2.9-2.6-.6-.6-2.6z" />
    <circle cx="6" cy="17.9" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const Prompt = (p: P) => (
  <Svg {...p}>
    <path d="M5 7.5 9.5 12 5 16.5" />
    <rect
      x="11.5"
      y="15"
      width="8"
      height="2.4"
      rx="1.2"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Node = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const Refresh = (p: P) => (
  <Svg {...p}>
    <path d="M19.2 13.2A7.4 7.4 0 1 1 16.8 6" />
    <path d="M19.6 3.4v6.2h-6.2z" fill="currentColor" />
  </Svg>
);

export const Thumb = ({ down, ...p }: P & { down?: boolean }) => (
  <Svg
    {...p}
    style={{ transform: down ? "scale(1, -1)" : undefined, ...p.style }}
  >
    <path d="M8 10.5 11.5 4a1.7 1.7 0 0 1 3.1 1.2l-.7 4h5a2 2 0 0 1 2 2.4l-1.2 6.3A2 2 0 0 1 17.7 19.5H8" />
    <rect
      x="3"
      y="10.5"
      width="5"
      height="9"
      rx="1.6"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Chart = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 17.5 8.5 12l3.5 3.5 5-6" />
    <circle cx="19.2" cy="7" r="2.6" fill="currentColor" stroke="none" />
    <path d="M3.5 20.5h17" />
  </Svg>
);

export const Table = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
    <path
      d="M3.5 8a3.5 3.5 0 0 1 3.5-3.5h10A3.5 3.5 0 0 1 20.5 8v1.5h-17z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M10 9.5v10M3.5 14.5h17" />
  </Svg>
);

export const Play = (p: P) => (
  <Svg {...p}>
    <path d="M8 5.8v12.4l9.6-6.2z" fill="currentColor" />
  </Svg>
);

export const Grip = (p: P) => (
  <Svg {...p} strokeWidth={3.2}>
    <path d="M9 6.5h.01M15 6.5h.01M9 12h.01M15 12h.01M9 17.5h.01M15 17.5h.01" />
  </Svg>
);

export const Mic = (p: P) => (
  <Svg {...p}>
    <rect
      x="9"
      y="3"
      width="6"
      height="11.5"
      rx="3"
      fill="currentColor"
      stroke="none"
    />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </Svg>
);

export const Speaker = ({ muted, ...p }: P & { muted?: boolean }) => (
  <Svg {...p}>
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
    {muted ? (
      <path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" />
    ) : (
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11" />
    )}
  </Svg>
);

export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="M10 6.5l5.5 5.5-5.5 5.5" />
  </Svg>
);

export const Layers = (p: P) => (
  <Svg {...p}>
    <path d="M8 4.5h9.5A2.5 2.5 0 0 1 20 7v9.5" />
    <rect
      x="4"
      y="8"
      width="12"
      height="12"
      rx="2.5"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Link = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-.8.8" />
    <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l.8-.8" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

export const More = (p: P) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const Eye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
  </Svg>
);

export const EyeOff = (p: P) => (
  <Svg {...p}>
    <path d="M6.6 7.2C4 8.9 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5M10 5.7c.6-.1 1.3-.2 2-.2 6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3.1" />
    <path d="M4 4l16 16" strokeWidth={2.4} />
  </Svg>
);

export const Alert = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="16.4" r="1.25" fill="currentColor" stroke="none" />
  </Svg>
);

export const Spark = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path
      d="M12.8 6.5 8.6 12.6h3.1l-.6 4.9 4.3-6.2h-3.1z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Cube = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.2 19.6 7.4v9.2L12 20.8l-7.6-4.2V7.4z" />
    <path
      d="M12 3.2 19.6 7.4 12 11.6 4.4 7.4z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M12 11.6v9.2" />
  </Svg>
);

export const Plug = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 9.5h11v2.5a5.5 5.5 0 0 1-11 0z" />
    <path d="M12 17.5V21" />
    <rect
      x="8.2"
      y="3"
      width="2.2"
      height="6"
      rx="1.1"
      fill="currentColor"
      stroke="none"
    />
    <rect
      x="13.6"
      y="3"
      width="2.2"
      height="6"
      rx="1.1"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Fork = (p: P) => (
  <Svg {...p}>
    <path d="M4 12h6" />
    <path d="M10 12c3 0 4-5.5 8.5-5.5M10 12c3 0 4 5.5 8.5 5.5" />
    <path d="M16.5 4.5l2.2 2-2.2 2M16.5 15.5l2.2 2-2.2 2" />
    <circle cx="10" cy="12" r="2.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const Shield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 19 5.8v5.4c0 4.4-3 7.9-7 9.8-4-1.9-7-5.4-7-9.8V5.8z" />
    <path d="m8.6 11.8 2.4 2.4 4.6-4.8" strokeWidth={2.4} />
  </Svg>
);

export const Send = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 3.5 3.5 10.3l6.6 2.9 2.9 6.6z" />
    <path d="M20.5 3.5 10.1 13.2l2.9 6.6z" fill="currentColor" stroke="none" />
  </Svg>
);

export const Redo = (p: P) => (
  <Svg {...p}>
    <path d="M15 9H8.5a4.5 4.5 0 0 0 0 9H14" />
    <path d="M14.4 4.6 19.4 9l-5 4.4z" fill="currentColor" />
  </Svg>
);

export const Captions = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3.5" />
    <path
      d="M7.6 11.2h4.2a1.2 1.2 0 0 1 0 2.4H7.6a1.2 1.2 0 0 1 0-2.4zM7.6 14.6h8.8a1.2 1.2 0 0 1 0 2.4H7.6a1.2 1.2 0 0 1 0-2.4z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Sliders = (p: P) => (
  <Svg {...p}>
    <path d="M4 8h16M4 16h16" />
    <path
      d="M9 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6zM15 13.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Pip = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3.5" />
    <rect
      x="11.5"
      y="11"
      width="6.5"
      height="5"
      rx="1.4"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

export const Shrink = (p: P) => (
  <Svg {...p}>
    <path d="M10 4v6H4M14 20v-6h6" />
    <path d="M4 4l6 6M20 20l-6-6" />
  </Svg>
);

export const RotateLeft = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="9.5" width="11" height="10.5" rx="2.4" />
    <path d="M12.5 5.5H9a5 5 0 0 0-5 5v2" />
    <path d="M12.2 2.6 15.6 5.5l-3.4 2.9z" fill="currentColor" />
  </Svg>
);

export const FlipH = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v17" strokeDasharray="2 2.6" />
    <path d="M9 7.5 3.5 17H9z" />
    <path d="M15 7.5 20.5 17H15z" fill="currentColor" />
  </Svg>
);
