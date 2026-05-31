// TasteMap design tokens — soft & modern, warm stone neutrals + amber accent.
// Lifted from the Claude Design prototype (docs/design-prototype/project/styles.css).
// Plain CommonJS so it can be required from tailwind.config.js (Node) on both
// web and mobile, and imported as values where className isn't available
// (e.g. react-native-maps marker colors).

const colors = {
  // surfaces & ink (warm)
  bg: "#f6f3ed",
  surface: { DEFAULT: "#ffffff", 2: "#faf8f4", 3: "#f1ece4" },
  ink: { DEFAULT: "#211d18", 2: "#5c554c", 3: "#938b80", 4: "#b7afa3" },
  line: { DEFAULT: "#ece6dc", 2: "#e0d9cd" },

  // accent (amber)
  accent: {
    DEFAULT: "#d97706",
    deep: "#b45309",
    ink: "#92400e",
    tint: "#fef0d6",
    wash: "#fdf8f0",
  },
  "on-accent": "#ffffff",

  // status semantics
  ok: { DEFAULT: "#1a7f48", bg: "#e4f3ea" },
  warn: { DEFAULT: "#b45309", bg: "#fbeccf" },
  mute: { DEFAULT: "#837b70", bg: "#efebe3" },
  danger: { DEFAULT: "#c0392b", bg: "#fbeae7" },

  // map pins
  pin: { mine: "#d97706", circle: "#0d9488" },
};

// radii (px)
const radii = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };

// elevation
const shadows = {
  1: "0 1px 2px rgba(33,29,24,.05), 0 1px 3px rgba(33,29,24,.04)",
  2: "0 2px 6px rgba(33,29,24,.06), 0 8px 20px rgba(33,29,24,.07)",
  3: "0 8px 24px rgba(33,29,24,.10), 0 18px 44px rgba(33,29,24,.13)",
  pin: "0 3px 8px rgba(33,29,24,.22), 0 1px 2px rgba(33,29,24,.18)",
};

// type
const fonts = {
  sans: ["Plus Jakarta Sans", "Noto Sans TC", "-apple-system", "system-ui", "sans-serif"],
};

module.exports = { colors, radii, shadows, fonts };
