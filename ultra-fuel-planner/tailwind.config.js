/** @type {import('tailwindcss').Config} */
const SRC = "/Users/bencarrington/Library/Mobile Documents/com~apple~CloudDocs/Nutrition Plan web code/ultra-fuel-planner/src";

module.exports = {
  darkMode: ["class"],
  content: [
    `${SRC}/pages/**/*.{js,ts,jsx,tsx,mdx}`,
    `${SRC}/components/**/*.{js,ts,jsx,tsx,mdx}`,
    `${SRC}/app/**/*.{js,ts,jsx,tsx,mdx}`,
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f0eb",
          100: "#e8ddd4",
          200: "#d1bba9",
          300: "#b9987e",
          400: "#a07b5a",
          500: "#8a6442",
          600: "#6e4f33",
          700: "#553c26",
          800: "#3d2a1a",
          900: "#261a10",
        },
        terrain: {
          flat: "#4a7c59",
          climb: "#c4773a",
          descent: "#5b7fa6",
          technical: "#8b6bb1",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
