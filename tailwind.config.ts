import type { Config } from "tailwindcss";

// Design language: civic / municipal notice-board.
// Deep navy + warm ochre "official stamp" accent, slab serif headings (Bitter),
// Public Sans body text (the typeface designed for U.S. government sites).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f6",
          100: "#d3daea",
          200: "#a7b6d5",
          300: "#7b91c0",
          400: "#4f6dab",
          500: "#2f4d87",
          600: "#1f3763",
          700: "#16294a",
          800: "#101d35",
          900: "#0a1224",
          950: "#060b16",
        },
        ochre: {
          50: "#fdf6e9",
          100: "#faeac6",
          200: "#f4d488",
          300: "#edbc4f",
          400: "#e2a52c",
          500: "#c88a1c",
          600: "#a36c16",
          700: "#7d5213",
          800: "#5c3c12",
          900: "#3f2a10",
        },
        parchment: "#f7f3ea",
        ink: "#1a1f2b",
      },
      fontFamily: {
        display: ["var(--font-bitter)", "Georgia", "serif"],
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        stamp: "0 0 0 2px rgba(200,138,28,0.25), 0 8px 24px -8px rgba(10,18,36,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
