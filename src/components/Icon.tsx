import React from "react";

const P: Record<string, string> = {
  oil: "M12 2 6.5 22M12 2l5.5 20M8.3 15h7.4M9.6 10h4.8M3.5 22h17M12 2v3",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  hook: "M8.5 2h7M12 2v7M12 9a4 4 0 1 1-4 4v-1.5M10 2l-1 3M14 2l1 3",
  roller: "M4 4h13v5H4zM17 6.5h3v6h-8v3M11 15.5h2V22h-2z",
  wheel: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 14v7M10.1 11.4 3.4 9.8M13.9 11.4l6.7-1.6",
  excavator: "M2 21h13M3 17.5h11V21H3zM4.5 17.5V13h6l2.5 4.5M10.5 13 16 5.5l5 4.5-2 4M19 14v3",
  tractor: "M7 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM18 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 13V5h6.5l2 8M14.5 13H20v4M3 13h9",
  helmet: "M3 18h18M5 18v-3a7 7 0 0 1 14 0v3M12 8V5M9 9.5V7M15 9.5V7",
  factory: "M3 21V11l5 3v-3l5 3V7l4-2v16M3 21h18M17 5h3v16M6 17h2M10 17h2",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6",
  growth: "M3 20h18M5 16l5-5 4 4 6-7M15 8h5v5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  arrow: "M5 12h14M13 6l6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5l4.5 4.5L19.5 7",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  users: "M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.5 4 2.8 4 6",
  briefcase: "M3 7h18v13H3zM8 7V4h8v3M3 12h18",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
  headset: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z",
  chat: "M4 5h16v11H9l-5 4z",
  play: "M8 5v14l11-7z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v5M16 3v5",
  filter: "M4 5h16l-6 7v6l-4 2v-8z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  whatsapp: "M4 20l1.3-3.9A8 8 0 1 1 8 19zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-2z",
  telegram: "M21 4 3 11l6 2 2 6 3-4 5 4zM9 13l12-9",
  max: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7.5 16V8l4.5 5 4.5-5v8",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  building: "M4 21V4h11v17M15 9h5v12M2 21h20M8 8h3M8 12h3M8 16h3",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  quote: "M5 17c2 0 3.5-1.5 3.5-4V7H4v6h3M14 17c2 0 3.5-1.5 3.5-4V7H13v6h3",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 8.5a1.5 1.5 0 1 0 0 .01",
  plus: "M12 5v14M5 12h14",
  chevron: "M6 9l6 6 6-6",
};

export function Icon({ name, size = 24, className, strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className ? `icon ${className}` : "icon"} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name] ?? P.sparkle} />
    </svg>
  );
}

const GROUP_HUES: Record<string, [string, string]> = {
  rabochie: ["#0f2448", "#16191f"],
  bezopasnost: ["#1b2a3f", "#141619"],
  dpo: ["#132a55", "#0f1626"],
};

/** Decorative artwork for a category, used when no real photo was added. */
export function CategoryArt({ icon, group, title, center }: { icon: string; group: string; title: string; center?: boolean }) {
  const cx = center ? 200 : 288, cy = center ? 130 : 110;
  const [a, b] = GROUP_HUES[group] ?? GROUP_HUES.rabochie;
  const id = `g-${icon}-${group}${center ? "-c" : ""}`;
  return (
    <svg className="cat-art" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx={center ? "0.5" : "0.72"} cy={center ? "0.5" : "0.42"} r="0.55">
          <stop offset="0" stopColor="#f5a524" stopOpacity="0.38" />
          <stop offset="1" stopColor="#f5a524" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-st`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="1" stopColor="#f08a1c" />
        </linearGradient>
        <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#ffffff" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="400" height="260" fill={`url(#${id}-bg)`} />
      <rect width="400" height="260" fill={`url(#${id}-grid)`} />
      <rect width="400" height="260" fill={`url(#${id}-glow)`} />
      {!center && <g transform="translate(-30 40) scale(11)" opacity="0.06" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={P[icon] ?? P.sparkle} />
      </g>}
      <circle cx={cx} cy={cy} r="74" fill="none" stroke="#f5a524" strokeOpacity="0.18" />
      <circle cx={cx} cy={cy} r="96" fill="none" stroke="#f5a524" strokeOpacity="0.08" />
      <g transform={`translate(${cx - 48} ${cy - 48}) scale(4)`} fill="none" stroke={`url(#${id}-st)`} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d={P[icon] ?? P.sparkle} />
      </g>
    </svg>
  );
}
