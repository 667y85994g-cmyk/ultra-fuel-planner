# Prompt 04 — Retire the Lucide mountain, deploy the lockups

**Goal:** remove every occurrence of the Lucide mountain icon and replace it
with the correct Ultra Fuel Planner lockup or symbol for its context. Also
deploy the primary and compact lockups in the obvious surfaces (navbar, hero,
footer).

**Why this matters:** the mountain icon is the single most visible piece of
pre-brand debt. Every day it's live is a day the product tells users it's a
generic fitness app.

## Read first

- `docs/brand/BRAND.md` — especially §2 (Wordmark) and §5 (Iconography)
- `docs/brand/audit-2026-Q2.md` — the Lucide mountain occurrences list and
  the Logo/brand surfaces list
- The four brand components you created in Prompt 02:
  `UFPMark`, `UFPLockup`, `UFPLockupCompact`, `UFPLockupStacked`

## Context → component mapping

Use this mapping. If a context isn't listed, stop and ask — don't guess.

| Context                              | Component           | Why                                       |
|--------------------------------------|---------------------|-------------------------------------------|
| Navbar (horizontal, any width)       | UFPLockupCompact    | Fits narrow bars, wordmark still legible  |
| Mobile navbar / sticky mini-nav      | UFPMark (symbol)    | Space-constrained                         |
| Hero, marketing, landing page        | UFPLockup (primary) | Highest-fidelity brand moment             |
| Footer                               | UFPLockupCompact    | Consistency with nav                      |
| Email header                         | UFPLockupCompact    | Same rationale, different render surface  |
| Loading spinner / empty state logo   | UFPMark             | Symbol only; lockup is too much           |
| Auth screens (login, signup)         | UFPLockupStacked    | Vertical layout, sits above form nicely   |
| OG image template                    | UFPLockupStacked    | Square-ish crop works on every platform   |
| PWA / Android icon                   | UFPMark on ochre    | See apple-touch-icon.svg for reference    |
| 404 / 500 pages                      | UFPMark             | Understated, not a marketing moment       |
| In-app notification (bell icon area) | —                   | No brand mark here; keep Lucide Bell      |

## What to do

### 1. Retire the mountain

For every occurrence in `docs/brand/audit-2026-Q2.md`'s "Lucide mountain
occurrences" section:

- Replace `<Mountain />`, `<MountainSnow />`, or equivalent with the correct
  component from the mapping table.
- Remove the Lucide import if it was the last mountain-family import in that file.
- Keep the size/className props on the old icon and pass them through.

### 2. Deploy the lockups

Follow the mapping table top-to-bottom. Wire each surface up. A few nuances:

- **Navbar:** the compact lockup is ~400×260. Render at height 28–36px. The
  wordmark is locked Instrument Serif; don't substitute a system font.
- **Hero:** primary lockup, render at width ~480–640px depending on layout.
  The profile line should be visually "grounded" — if the hero has a
  horizontal rule beneath content, align the lockup's baseline to it.
- **Auth screens:** stacked lockup above the form, centred. Minimum 48px
  breathing room between lockup and form.

### 3. Retire the Lucide dependency if no longer needed

If, after the sweep, `lucide-react` (or equivalent) still has callers for other
icons (menu, close, chevron, etc.), leave the dependency in place — we're only
retiring the mountain, not the whole library.

If no callers remain, uninstall the dependency:

```bash
npm uninstall lucide-react  # or the project's package manager equivalent
```

### 4. Update the OG image generator

Whatever generates the site's OpenGraph image (likely `@vercel/og`, Satori,
or a static template): update the template to use the stacked lockup on a
paper background. 1200×630, safe area 120px. Commit one reference generated
image to `assets/brand/og/default.png`.

## What not to do

- Don't touch non-mountain Lucide icons.
- Don't create new lockup variations. If a context doesn't fit any existing
  lockup, raise it for a design decision instead of inventing one.
- Don't raster the SVGs. They stay vector.

## Deliverable

Branch `brand/04-logo`. PR titled `brand: retire Lucide mountain, deploy lockups`.

## Success criteria

- `grep -r "Mountain\b\|MountainSnow" src/ app/ components/` returns zero results
- Every surface listed in the audit's "Logo / brand surfaces" section now
  renders a UFP component
- OG image test: request `/api/og` (or equivalent) and verify the generated
  PNG shows the stacked lockup
- Screenshots in the PR: navbar (desktop + mobile), hero, footer, auth,
  404, OG preview
