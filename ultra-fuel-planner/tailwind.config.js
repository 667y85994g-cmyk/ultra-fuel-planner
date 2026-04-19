/** @type {import('tailwindcss').Config} */
const path = require("path");
const srcDir = path.join(__dirname, "src");
module.exports = {
  darkMode: ["class"],
  content: [
    path.join(srcDir, "pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(srcDir, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(srcDir, "app/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand tokens (canonical) ─────────────────────────────────────
        paper: {
          DEFAULT: '#f4efe6',
          2: '#ede6d8',
          3: '#e5dcc8',
          dim: '#d8cfbe',
        },
        ink: {
          DEFAULT: '#17140f',
          2: '#3a342a',
          3: '#6b6356',
          4: '#a39a89',
        },
        ochre: {
          DEFAULT: '#c2691a',
          hover: '#a85a14',
          soft: '#e6b787',
        },
        clay: '#a83d18',
        forest: '#1f5c3a',
        'ufp-slate': '#225668',
        rule: '#d8cfbe',
        // ── Terrain (categorical, earthy) — mirror globals.css and utils.ts ──
        terrain: {
          'flat-runnable':     '#cbb68a',
          rolling:             '#a88a5a',
          'sustained-climb':   '#876a3c',
          'steep-climb':       '#5c4824',
          'runnable-descent':  '#6b5c4c',
          'technical-descent': '#3d3228',
          recovery:            '#8a8074',
        },
      },
      fontFamily: {
        display: ["var(--font-display)", '"Instrument Serif"', '"Source Serif Pro"', 'Georgia', 'serif'],
        sans:    ["var(--font-inter)", 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono:    ["var(--font-mono)", '"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        eyebrow:       ['11px', { letterSpacing: '0.16em', lineHeight: '1.2' }],
        'data-sm':     ['11px', { letterSpacing: '0.04em' }],
        data:          ['13px', { letterSpacing: '0.02em' }],
        body:          ['15px', { lineHeight: '1.55' }],
        lede:          ['19px', { lineHeight: '1.55' }],
        h4:            ['20px', { lineHeight: '1.3' }],
        h3:            ['26px', { lineHeight: '1.2' }],
        h2:            ['38px', { lineHeight: '1.1' }],
        display:       ['56px', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'display-hero':['96px', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        lg: '8px',
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
