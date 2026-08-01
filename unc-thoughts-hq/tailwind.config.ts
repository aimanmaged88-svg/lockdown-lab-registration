import type { Config } from "tailwindcss";

/**
 * UNC Thoughts visual identity: black, off-white, restrained grey.
 * Bold condensed headings, generous spacing, strong contrast, minimal animation.
 * Deliberately NOT a colourful business dashboard.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0B0C", // near-black surface
          soft: "#141416",
          card: "#161618",
          line: "#26262A",
          line2: "#333338",
        },
        paper: {
          DEFAULT: "#F4F2EC", // off-white
          soft: "#E9E7DF",
          dim: "#B9B7AF",
        },
        grey: {
          DEFAULT: "#8A8A90",
          soft: "#5B5B61",
        },
        accent: {
          // restrained single accent — used sparingly for state, never decoration
          DEFAULT: "#C7402E", // muted brick (the ball)
          soft: "#E7674F",
        },
        good: "#3E8E5A",
        warn: "#C79A34",
        bad: "#B0413A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Oswald", "Arial Narrow", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      maxWidth: {
        app: "1180px",
      },
      keyframes: {
        fadein: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        fadein: "fadein .18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
