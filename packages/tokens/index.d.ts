type Shade = { DEFAULT: string } & Record<string, string>;

export const colors: {
  bg: string;
  surface: Shade;
  ink: Shade;
  line: Shade;
  accent: { DEFAULT: string; deep: string; ink: string; tint: string; wash: string };
  "on-accent": string;
  ok: { DEFAULT: string; bg: string };
  warn: { DEFAULT: string; bg: string };
  mute: { DEFAULT: string; bg: string };
  danger: { DEFAULT: string; bg: string };
  pin: { mine: string; circle: string };
};

export const radii: { xs: number; sm: number; md: number; lg: number; xl: number; pill: number };

export const shadows: { 1: string; 2: string; 3: string; pin: string };

export const fonts: { sans: string[] };
