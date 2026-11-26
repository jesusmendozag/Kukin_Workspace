// Íconos dibujados con el mismo trazo (2px, puntas redondas). Tamaño por className.
const Svg = ({ className = 'w-6 h-6', children, fill = 'none' }) => (
  <svg viewBox="0 0 24 24" fill={fill} className={className} stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconHome = (p) => (
  <Svg {...p}><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10z" /></Svg>
);
export const IconPantry = (p) => (
  <Svg {...p}><path d="M4 10h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" /><path d="M3 10l2-6h14l2 6" /><path d="M9 14h6" /></Svg>
);
export const IconPot = (p) => (
  <Svg {...p}><path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6z" /><path d="M2 10h20" /><path d="M9 6c0-1 .6-2 1.5-2M14 6c0-1 .6-2 1.5-2" /></Svg>
);
export const IconLeaf = (p) => (
  <Svg {...p}><path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z" /><path d="M5 21l8-8" /></Svg>
);
export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></Svg>
);
export const IconPlus = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IconBack = (p) => (
  <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>
);
export const IconClose = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const IconCheck = (p) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Svg>
);
export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>
);
export const IconClock = (p) => (
  <Svg className="w-5 h-5" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const IconServings = (p) => (
  <Svg className="w-5 h-5" {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></Svg>
);
export const IconTrash = (p) => (
  <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>
);
export const IconSparkle = (p) => (
  <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></Svg>
);
export const IconFire = (p) => (
  <Svg {...p}><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" /></Svg>
);
export const IconDumbbell = (p) => (
  <Svg {...p}><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" /></Svg>
);
export const IconHeart = (p) => (
  <Svg {...p}><path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-2 4.5 4.5 0 0 1 9 2c-2 4.5-9 9-9 9z" /></Svg>
);
export const IconMoon = (p) => (
  <Svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></Svg>
);
export const IconSpeaker = (p) => (
  <Svg {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></Svg>
);
export const IconTimer = (p) => (
  <Svg {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M10 2h4" /></Svg>
);
export const IconCart = (p) => (
  <Svg {...p}><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20.5" r="1" /><circle cx="17" cy="20.5" r="1" /></Svg>
);
export const IconShare = (p) => (
  <Svg {...p}><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></Svg>
);
export const IconEdit = (p) => (
  <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></Svg>
);
