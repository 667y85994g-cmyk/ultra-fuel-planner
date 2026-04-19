/* =====================================================================
   Ultra Fuel Planner — Tailwind token extension
   For Tailwind v3: merge into tailwind.config.{js,ts} under theme.extend
   For Tailwind v4: mirror these values into @theme inline blocks in CSS
   Keep this file as the single source of truth and import it.
   ===================================================================== */

module.exports = {
  colors: {
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
    // Signal palette — used sparingly, never for brand surfaces
    clay: '#a83d18',   // warning, hard section
    forest: '#1f5c3a', // success, trail completion
    slate: '#225668',  // info, water, nav
    rule: '#d8cfbe',
  },

  fontFamily: {
    display: ['"Instrument Serif"', '"Source Serif Pro"', 'Georgia', 'serif'],
    sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
    mono:    ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
  },

  fontSize: {
    // Editorial scale — only what's actually used in the system
    'eyebrow':      ['11px',  { letterSpacing: '0.16em', lineHeight: '1.2' }],
    'data-sm':      ['11px',  { letterSpacing: '0.04em' }],
    'data':         ['13px',  { letterSpacing: '0.02em' }],
    'body':         ['15px',  { lineHeight: '1.55' }],
    'lede':         ['19px',  { lineHeight: '1.55' }],
    'h4':           ['20px',  { lineHeight: '1.3' }],
    'h3':           ['26px',  { lineHeight: '1.2' }],
    'h2':           ['38px',  { lineHeight: '1.1' }],
    'display':      ['56px',  { lineHeight: '1.05', letterSpacing: '-0.01em' }],
    'display-hero': ['96px',  { lineHeight: '0.98', letterSpacing: '-0.02em' }],
  },

  borderRadius: {
    sm: '2px',
    DEFAULT: '4px',
    lg: '8px',
    // Explicitly NO full-pill / rounded-2xl — the system is square-ish.
  },
};
