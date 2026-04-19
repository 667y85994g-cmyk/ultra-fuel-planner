# Ultra Fuel Planner — Brand Surface Audit (2026 Q2)

Read-only inventory produced by Prompt 01. No code was changed.
Everything listed here is the _from_ state; `docs/brand/BRAND.md` describes the _to_ state.

---

## Stack

Next.js 15.2.4 (App Router, React 19, TypeScript 5) with Tailwind CSS v3.4.17 as the primary
styling strategy — utility classes throughout, a thin set of Radix UI primitive wrappers in
`src/components/ui/`, and Recharts for elevation charts. Icons come exclusively from
`lucide-react`; fonts are loaded via `next/font/google` (Inter only — no Instrument Serif or
JetBrains Mono loaded anywhere in the codebase today).

---

## Current palette usage

### `stone-` (primary background/text family — highest volume)

| Occurrences | File |
|-------------|------|
| 62 | `src/components/results/SummaryView.tsx` |
| 62 | `src/app/how-to-fuel-an-ultra/page.tsx` |
| 57 | `src/app/page.tsx` |
| 40 | `src/components/planner/StepAthlete.tsx` |
| 25 | `src/components/planner/StepCalibration.tsx` |

Most-used values across the codebase: `stone-500` (138×), `stone-400` (83×),
`stone-800` (82×), `stone-200` (70×), `stone-300` (58×).
`globals.css` also wires `stone-950` and `stone-800` into the `<body>` and
`<h*>` base layer — this is the deepest root to fix.

### `amber-` (accent family)

| Occurrences | File |
|-------------|------|
| 20 | `src/app/page.tsx` |
| 13 | `src/app/how-to-fuel-an-ultra/page.tsx` |
| 12 | `src/components/results/SummaryView.tsx` |
| 10 | `src/components/planner/StepAthlete.tsx` |
| 9  | `src/components/planner/StepCalibration.tsx` |

Most-used values: `amber-400` (38×), `amber-500` (36×), `amber-900` (29×),
`amber-700` (25×), `amber-800` (20×). The Mountain icon invariably carries
`text-amber-500`; the progress bar in `src/components/ui/progress.tsx` is
hard-wired to `bg-amber-700`.

### Raw hex values (canvas / inline styles)

| Occurrences | File |
|-------------|------|
| 143 | `src/app/print/page.tsx` |
| 31  | `src/app/opengraph-image.tsx` |
| 16  | `src/components/results/RouteMapView.tsx` |
| 8   | `src/lib/utils.ts` |
| 7   | `src/app/globals.css` |

Dominant raw values: `#6b5c4c` (24×), `#f59e0b` (18×), `#92400e` (15×),
`#fb923c` (12×), `#f97316` (8×). These appear almost entirely inside canvas
`ctx.*` calls and SVG `fill=` / `stroke=` attributes in the print page —
a Tailwind sweep will not catch them.

### Pure black / white

- `#ffffff` — `src/app/print/page.tsx:1333` (QR code `bgColor` prop)
- `#000` — `src/components/results/RouteMapView.tsx:155` (Leaflet `color` prop)

### Other colour families

- `slate-`: 1 occurrence in `src/components/ui/select.tsx` (low risk)
- `zinc-`: 0 occurrences
- `gray-`: 0 occurrences
- `#000000` / `#ffffff` as full hex: 0 occurrences (the two above use short form)

---

## Current typography

### Fonts loaded

| Font | Loaded via | CSS variable / class |
|------|-----------|----------------------|
| Inter | `next/font/google` in `src/app/layout.tsx` | `--font-inter` → `font-sans` |
| Instrument Serif | **not loaded** | — |
| JetBrains Mono | **not loaded** | — |

### Tailwind font-* classes in use

`font-semibold` (65×), `font-bold` (51×), `font-medium` (66×), `font-normal` (7×),
`font-extrabold` (1×), `font-mono` (1× — `src/components/results/TimelineView.tsx:163`),
`font-inter` (1× — non-standard, resolves to nothing in production).

The single `font-mono` usage resolves to system monospace (the `--font-mono` variable
is declared in `tailwind.config.ts` but never assigned a value in layout). JetBrains
Mono is absent throughout.

### Hardcoded `font-family` declarations

| File | Value |
|------|-------|
| `src/app/print/page.tsx:820` | `"system-ui, -apple-system, Arial, sans-serif"` |
| `src/app/print/page.tsx:758` | `"system-ui, sans-serif"` |
| `src/app/print/page.tsx:766` | `"system-ui, sans-serif"` |
| `src/app/print/page.tsx:1072` | `"monospace"` (generic family, data column) |
| `src/app/opengraph-image.tsx:18` | `"system-ui, -apple-system, sans-serif"` |

Instrument Serif is required for display/heading roles (≥20px). No headings in the
current app use it. All display text is Inter with `font-bold` or `font-semibold`.

---

## Lucide mountain occurrences

Every occurrence is the `Mountain` icon from `lucide-react`. No `MountainSnow` or
other mountain-variant is used. All are retirement targets for Prompt 04.

| File | Import line | Render lines |
|------|-------------|--------------|
| `src/app/page.tsx` | 4 | 45, 133, 417 |
| `src/app/planner/page.tsx` | 5 | 56 |
| `src/app/results/page.tsx` | 7 | 71 |
| `src/app/how-to-fuel-an-ultra/page.tsx` | 3 | 33, 351 |
| `src/app/log/page.tsx` | 3 | 80 |
| `src/app/log/how-i-fueled-100km-ultra/page.tsx` | 4 | 104 |
| `src/app/privacy/page.tsx` | 2 | 19 |
| `src/app/terms/page.tsx` | 2 | 19 |
| `src/app/disclaimer/page.tsx` | 2 | 19 |
| `src/components/LegalFooter.tsx` | 2 | 15 |
| `src/components/planner/StepCalibration.tsx` | 17 | 277 |
| `src/components/planner/StepRoute.tsx` | 12 | 237 |

**Total: 12 files, ~22 render sites.**

Note: `src/components/planner/StepAthlete.tsx:36` contains the string
`"mountain_ultra"` as a data value — this is not an icon import, leave it alone.

---

## Logo / brand surfaces

Every surface where the product presents its identity:

| Surface | File | Current treatment |
|---------|------|-------------------|
| Homepage hero nav | `src/app/page.tsx:44–48` | Mountain icon + "Ultra Fuel Planner" text span |
| Homepage CTA section | `src/app/page.tsx:417` | Large Mountain icon, decorative |
| Homepage "How it works" card | `src/app/page.tsx:133` | Mountain icon (orange variant) |
| Planner nav | `src/app/planner/page.tsx:55–58` | Mountain icon + text + version string |
| Results nav | `src/app/results/page.tsx:70–73` | Mountain icon + text (hidden on mobile) |
| How-to-fuel nav | `src/app/how-to-fuel-an-ultra/page.tsx:32–36` | Mountain icon + text |
| How-to-fuel CTA | `src/app/how-to-fuel-an-ultra/page.tsx:351` | Mountain icon, decorative |
| Log index nav | `src/app/log/page.tsx:79–82` | Mountain icon + text |
| Log article nav | `src/app/log/how-i-fueled-100km-ultra/page.tsx:103–107` | Mountain icon + text |
| Privacy nav | `src/app/privacy/page.tsx:18–21` | Mountain icon + text |
| Terms nav | `src/app/terms/page.tsx:18–21` | Mountain icon + text |
| Disclaimer nav | `src/app/disclaimer/page.tsx:18–21` | Mountain icon + text |
| LegalFooter | `src/components/LegalFooter.tsx:14–15` | Mountain icon + tagline (every page) |
| Print page header | `src/app/print/page.tsx:860–870` | Text-only ("Ultra Fuel Planner") + domain |
| Print page footer (QR) | `src/app/print/page.tsx:1335–1350` | Text + QR code |
| Favicon (browser + PWA) | `src/app/icon.tsx` | Custom polygon mountain drawn via ImageResponse |
| Apple touch icon | `src/app/apple-icon.tsx` | Same polygon, 180×180 |
| OG / social image | `src/app/opengraph-image.tsx` | Text "Ultra Fuel Planner" drawn via ImageResponse, no SVG lockup |
| PWA manifest | `src/app/manifest.ts` | Name/short_name strings; references /icon + /apple-icon |

---

## Long tail

Surfaces typically missed in brand migrations:

| Surface | File | Notes |
|---------|------|-------|
| 404 page | **does not exist** | Next.js serves its own default — needs `src/app/not-found.tsx` |
| 500 / error page | **does not exist** | No `src/app/error.tsx` — Next.js default shown on crash |
| Loading state | **does not exist** | No `src/app/loading.tsx`; results page has an inline spinner (`src/app/results/page.tsx`) |
| Route empty state | `src/components/planner/StepRoute.tsx` | "Upload a GPX file" message inline |
| Map empty state | `src/components/results/RouteMapView.tsx:173–181` | "No route data" fallback |
| Print "no plan" state | `src/app/print/page.tsx:756–770` | Full-page fallback with `system-ui` font |
| Generate step UI | `src/components/planner/StepGenerate.tsx` | Empty-ish step — no route = reduced UI |
| Auth screens | **none** | No auth system; not applicable |
| Email templates | **none** | No transactional email; not applicable |
| Onboarding | **none** | Not applicable |
| Paywall | **none** | Tool is free; not applicable |

---

## Risks + open questions

1. **Canvas / SVG in print page (143 raw hex values).** `src/app/print/page.tsx`
   renders everything — route map, elevation profile, section table colours — via
   Canvas 2D API and inline SVG. These calls use raw hex and are invisible to
   Tailwind. Each must be manually mapped to brand tokens. This is the highest-effort
   file in the entire migration.

2. **OG image cannot use Google Fonts.** `src/app/opengraph-image.tsx` runs on the
   edge runtime. `next/font/google` is not available there. Instrument Serif would
   need to be fetched as a raw font buffer and passed to `ImageResponse` — doable
   but requires a different loading pattern than the rest of the app.

3. **icon.tsx / apple-icon.tsx draw a custom polygon, not the brand SVG.** Both use
   `ImageResponse` and draw a hardcoded mountain shape. The brand's `symbol.svg`
   cannot be imported as JSX into an edge function — it would need to be inlined as
   raw SVG markup or the icon strategy changed to a static file in `/public`.

4. **Tailwind config colour scale doesn't match brand tokens.** `tailwind.config.ts`
   defines `brand.50–900` (a warm ramp) and `terrain.*` colours. Neither maps to the
   BRAND.md token names (`paper`, `ink`, `ochre`, etc.). Prompt 02 needs to replace
   this scale entirely — any component using `bg-brand-*` will break and needs
   updating.

5. **`globals.css` base layer hardwires stone/dark theme.** `body { @apply
   bg-stone-950 text-stone-100 }` and `h* { @apply text-stone-50 }` mean that even
   after a palette sweep, the document root will default to the wrong colours until
   `globals.css` is updated. Terrain bar classes (`.terrain-bar-*`) also carry raw
   hex that sits outside the component tree.

6. **Radix UI wrappers carry stone/amber.** `src/components/ui/card.tsx`,
   `progress.tsx`, and `select.tsx` have hardcoded `stone-` and `amber-` classes
   baked into the wrapper defaults. These will need updating in Prompt 03 alongside
   the page-level sweep.

7. **Leaflet CSS import may resist theming.** `RouteMapView.tsx` imports
   `leaflet/dist/leaflet.css` globally. Leaflet's popup and control styles are
   outside the Tailwind system and may need targeted overrides if any UI chrome
   (zoom buttons, attribution) is visible in the migrated design.

8. **Terrain colour system has two competing definitions.** Raw hex values appear in
   `src/lib/utils.ts` (`terrainColor()` function) and as Tailwind classes in
   `tailwind.config.ts` (`terrain.*`). These are used in different places; a
   migration needs to consolidate them into a single token definition without
   breaking the map rendering or the elevation chart.

9. **Print page uses `system-ui` font.** The print stylesheet (`print/page.tsx`) is
   built entirely with inline styles referencing `system-ui`. When Instrument Serif
   and JetBrains Mono are added to the app, they will not automatically apply to
   print output — the inline styles need explicit `fontFamily` values added.

10. **No 404 or error pages exist.** A user who hits a missing URL or a runtime
    crash sees Next.js defaults. These need creating as part of the brand migration
    (Prompt 06 / long tail) to avoid unbranded surfaces in production.
