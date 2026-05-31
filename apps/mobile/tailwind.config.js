const nativewindPreset = require("nativewind/preset");
const tasteMapPreset = require("@tastemap/tokens/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [nativewindPreset, tasteMapPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};
