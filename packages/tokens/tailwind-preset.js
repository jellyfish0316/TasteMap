// Tailwind preset shared by web (frontend/) and mobile (apps/mobile, via NativeWind).
// Each app adds its own `content` globs; the brand theme lives here.
const { colors, radii, shadows, fonts } = require("./index");

const px = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === "number" ? `${v}px` : v]),
  );

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors,
      borderRadius: {
        ...px(radii),
        full: "9999px",
      },
      boxShadow: {
        "sh-1": shadows[1],
        "sh-2": shadows[2],
        "sh-3": shadows[3],
        pin: shadows.pin,
      },
      fontFamily: {
        sans: fonts.sans,
      },
    },
  },
};
