import tasteMapPreset from "@tastemap/tokens/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [tasteMapPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
