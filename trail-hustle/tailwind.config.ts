import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core
        "th-black": "#0C0C0C",
        "th-white": "#F5F2EC",
        // Core+ — optimistic earth tones
        sandstone: "#C4A87A",
        "burnt-ochre": "#B5531C",
        "clay-red": "#9C3628",
        "forest-green": "#2B5426",
        "sun-yellow": "#D4A020",
        "ocean-slate": "#4A6878",
        // Secondary — pops of optimism
        "electric-coral": "#E84030",
        ultraviolet: "#6030A0",
        "hot-teal": "#00A896",
        "copper-flare": "#C86420",
        "sky-green": "#48B258",
      },
      fontFamily: {
        sans: ["Cal Sans", "system-ui", "-apple-system", "sans-serif"],
        body: ["system-ui", "-apple-system", "Helvetica Neue", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.25em",
        "ultra-wide": "0.4em",
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
