# Ultra Fuel Planner — Brand system (canonical reference)

This file is the single source of truth for the visual system.
Claude Code should read it at the start of every brand-migration prompt.
If this file and existing code disagree, **this file wins and the code is wrong.**

---

## 1. Positioning

Trail register, not tech register. Reference points: Fjällräven, Mountain Equipment,
RAB, Ordnance Survey. Not: Maurten, Ciele, or any Silicon Valley runtime.

Tone: pragmatic, understated, editorial. Written by someone who has been cold and
wet at 3am and still made the cut-off. Avoid motivational clichés, avoid hype, avoid
"optimise your performance" language. A runner should trust this brand the way they
trust a map.

---

## 2. Wordmark — LOCKED

**Instrument Serif, Title-Case.** No lowercase. No mixed treatments. No alternative cut.

Three lockups cover every deployment:

| Lockup      | File                        | Use                                        |
|-------------|-----------------------------|--------------------------------------------|
| Primary     | `logo/primary.svg`          | Hero, marketing, print cover, OG images     |
| Nav         | `logo/nav.svg`              | Top nav bar at h-11 (44px) — single-line    |
| Stacked     | `logo/stacked.svg`          | Avatars, merch, social cards, square crops  |
| Compact     | `logo/compact.svg`          | Footer, email signature, constrained UI     |
| Symbol      | `logo/symbol.svg`           | Favicon (large), loader, standalone mark    |
| Symbol inv. | `logo/symbol-inverse.svg`   | Dark surfaces, video overlays               |
| Wordmark    | `logo/wordmark.svg`         | Rare: text-only placements, legal footers   |

Clear space around any lockup: minimum `0.5 × profile height`.
Minimum display width for Primary: **180px**. Below that, use Compact.
Minimum for Compact: **120px**. Below that, use Symbol.

**Wordmarks are font-independent.** All wordmark text in the lockup SVGs is
outlined path data generated from Instrument Serif via
`scripts/generate-wordmark-paths.ts`. The lockups render correctly offline,
with fonts blocked, and in edge runtimes. Do not convert paths back to live
`<text>` elements. The nav lockup carries a `stroke-width="0.4"` optical
correction to prevent thin serif strokes reading as brittle at small display
sizes. See README.md for the regeneration workflow.

---

## 3. Palette

Canonical tokens live in `tokens.css` and `tailwind.tokens.js`. Use tokens — never
raw hex — in application code.

```
paper          #f4efe6   base surface
paper-2        #ede6d8   section background
paper-3        #e5dcc8   card, callout
paper-dim      #d8cfbe   rules on paper

ink            #17140f   primary text, primary line
ink-2          #3a342a   body text
ink-3          #6b6356   secondary text
ink-4          #a39a89   tertiary, captions, axis

ochre          #c2691a   the fuel dot. The single accent. Sparingly.
ochre-hover    #a85a14
ochre-soft     #e6b787   fills and tints only — never text

clay           #a83d18   warning / hard-section banding
forest         #1f5c3a   success / trail completion
slate          #225668   info / water / nav background
```

**Rule of one ochre.** In any single viewport there should be at most one piece
of ochre copy/ink/fill doing the work of "this is the attention". Two ochres
in frame is a bug.

**Ochre — solid vs ghost.** Solid ochre fill (paper text) is reserved for the
single most important call-to-action on a page, inside content. On a landing
hero, the "Build your plan" button is solid. On an article page, there is no
solid-ochre button. Ghost ochre (ochre text, ochre 1.5px border, paper fill)
is the default everywhere else: nav CTAs, secondary hero actions, inline
buttons. Rule of thumb: solid ochre appears at most once per screen.

**Retired:** `stone-950`, `amber-500`, any Tailwind default slate/gray/zinc,
any pure `#000` or `#fff`. Remove on sight.

---

## 4. Typography

| Role       | Font                 | Weight       | Where                                     |
|------------|----------------------|--------------|-------------------------------------------|
| Display    | Instrument Serif     | 400 / 400 it | Hero titles, section headings, lockups    |
| Interface  | Inter                | 400 / 500 / 600 | Buttons, body, forms, menus           |
| Data       | JetBrains Mono       | 400 / 500    | Numbers, km/calories/grams, axis labels   |

Body copy: 15px, 1.55 line-height, `ink-2`. Never full black.
Eyebrows: 11px JetBrains Mono, uppercase, letter-spacing 0.16em, `ink-3`.

Do not apply Instrument Serif to anything smaller than 20px — it breaks below
that size. Use Inter for small UI text.

---

## 5. Iconography

The **Lucide mountain icon is retired.** Every occurrence must be removed.
Anything that needs to read as "Ultra Fuel Planner" uses `logo/symbol.svg`
or one of the lockups above.

For general UI icons (menu, close, chevron, etc.), keep Lucide — it's fine for
chrome. The ban is specific to the mountain icon.

**Signature vs accent.** The brand mark (UFPMark or any lockup) is a
signature. It identifies the product on identity surfaces — navigation,
footer, 404/500/loading, print, OG previews, empty states. It is *not*
a general-purpose icon. On feature cards, section dividers, CTA accents,
or anywhere the goal is to communicate content rather than identify the
product, use a Lucide icon sized to context. Rule of thumb: the mark
appears at most twice per screen — once in nav, once in footer. A third
usage is almost always wrong.

---

## 6. Voice principles (applies to microcopy)

- **Say the weather.** Prefer concrete over abstract. "12km to the next stream"
  beats "hydration point approaching".
- **Numbers in mono, never in prose.** Inline data gets JetBrains Mono treatment.
- **Active, not passive.** "You'll hit the 50% checkpoint at 3h42." Not
  "the 50% checkpoint will be encountered."
- **No emoji. No exclamation marks.** The trail isn't excited about itself.
- **British English.** Fuelling, litre, kilogram, aluminium.

---

## 7. The fuel dot — meaning

The ochre dot marks the apex of the profile and functions as the brand signature.
In UI contexts it may also mark a fuelling moment on a route. In iconography it
stays locked to the apex. It is not a GPS pin, not a warning, not a CTA colour —
it is the brand's one accent and it has a specific job.

---

## 8. Don'ts (historical lessons)

- Don't reintroduce `stone-950` / `amber-500` — this was the pre-brand state.
- Don't apply `rounded-full` to cards or large surfaces. Radius is 2/4/8 only.
- Don't use gradients. The system is flat ink on paper.
- Don't add emoji. Ever.
- Don't paraphrase the lockups — always use the SVG files.
- Don't tint the ochre. It's one specific value.
- Don't set body copy in Instrument Serif.

---

## Changelog

**v1.0 — initial publication** (with Prompt 01)

**v1.1 — 2026-04-19:** corrections and additions after initial implementation.
- §2: Nav lockup added to table; wordmark font-independence note added
- §3: Solid-vs-ghost ochre CTA rule added
- §5: Signature-vs-accent rule codified; UFPMark placement limits documented

**v1.2 — 2026-04-19:** post-refinement corrections (Refinements 01–03).
- SiteNav consolidated to single source of truth; planner wrapped with SiteNav + PlannerStepBar via layout.tsx
- Version badges removed from all rendered chrome (nav, footer, page body)
- Button em-dash addenda removed; repeated trust tags eliminated
- All emoji removed from source: fuelTypeIcon() → text codes; empty states → Lucide icons; ACTION_ICONS → ACTION_DOT CSS classes
- Remaining ✓/✅ tick marks in StepCalibration replaced with Lucide Check/X icons
- All 17 automated checks confirmed PASS on clean source (no .next/ false positives)
