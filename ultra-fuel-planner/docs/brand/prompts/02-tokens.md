# Prompt 02 — Install tokens + fonts (non-destructive)

**Goal:** add the new brand tokens alongside the existing ones. Do not replace
or remove the existing palette yet. Both worlds live side-by-side for one PR so
migration can be incremental.

**Why non-destructive:** the palette sweep (Prompt 03) is mechanical and should
be a separate PR so the diff is legible. Mixing token installation with token
usage in one PR produces a thousand-line diff no one can review.

## Read first

- `docs/brand/BRAND.md` — full file
- `docs/brand/tailwind.tokens.js` — the extension
- `docs/brand/fonts-head.html` — font import snippet
- `docs/brand/audit-2026-Q2.md` — the audit from Prompt 01

## What to do

### 1. Install tokens

Copy `assets/brand/tokens.css` and import it at the app entry point so the
custom properties are globally available. If Tailwind is in use, extend the
theme in `tailwind.config.{js,ts}` by importing from
`docs/brand/tailwind.tokens.js` and merging into `theme.extend`.

**Do not remove or rename any existing token.** If the current config has
`amber: { 500: '#...' }`, leave it — we'll remove it in the palette sweep.

### 2. Install fonts

Inject the contents of `docs/brand/fonts-head.html` into the app's root HTML
(`<head>`). If using Next.js, use `next/font` to self-host Instrument Serif,
Inter, and JetBrains Mono. If any of those fonts are already imported, leave
them in place.

Verify the three families render by spinning up the dev server and opening
any page in a browser — check in DevTools that a request fires for Instrument
Serif, Inter, and JetBrains Mono. This is the one dev-server check required.

### 3. Add a brand symbol component

Create a React/Vue component at `components/brand/UFPMark.tsx` (or the
project's idiomatic equivalent) that inlines `assets/brand/logo/symbol.svg`
and accepts a `className` prop. Same for `UFPLockup` (primary),
`UFPLockupCompact`, and `UFPLockupStacked`. These are thin wrappers — each
file should be under 30 lines.

**Inline the SVG source rather than using `<img src>`.** Inlined SVGs respect
`currentColor` for theming and don't need an extra HTTP request.

### 4. Don't change anything else

No component edits, no page edits, no Tailwind class replacements. If you
notice something obviously broken while wiring up the tokens, leave a
`// TODO(brand-03): ...` comment — the palette sweep will pick it up.

## Deliverable

Branch `brand/02-tokens`. One PR titled `brand: install tokens + fonts (no UI changes)`.

## Success criteria

- `var(--ufp-paper)` resolves in DevTools on any page
- Both old and new Tailwind tokens exist side-by-side; `bg-stone-950` and
  `bg-ink` both work
- Three brand fonts are loaded on page load
- Four brand components exist under `components/brand/` and are exported
- Visual diff: zero pixel changes against main. If anything changed
  visually, something was edited that shouldn't have been.
