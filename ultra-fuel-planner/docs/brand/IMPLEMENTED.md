# Ultra Fuel Planner — Brand implementation handoff

**Migration completed:** 2026-04-19

---

## Summary

The full brand migration (Prompts 01 → 07) replaced the pre-2026 design system —
which used Tailwind's stone/amber defaults, the Lucide Mountain icon as the
product mark, and unsystematic typography — with a coherent paper/ink/ochre token
system anchored on trail-register editorial voice. Every user-facing surface was
touched: landing page, planner, results, print, editorial articles, legal pages,
favicons, OG image, and the safety-net pages (404, 500, loading). The brand mark
is now a purpose-built SVG lockup system (symbol + five lockup variants) with
font-independent outlined wordmark paths. No auth, database, or transactional
email surfaces were in scope.

---

## Surfaces covered

| Surface | Brand sections satisfied |
|---|---|
| Landing page (`/`) | §1 Positioning, §2 Lockups, §3 Palette, §4 Typography |
| Planner flow (`/planner`) | §3 Palette, §4 Typography, §5 Iconography |
| Results pages | §3 Palette, §4 Typography, §5 Iconography |
| Print / race card | §3 Palette, §4 Typography |
| How-to-fuel article | §1 Voice, §4 Typography (Instrument Serif h1/h2) |
| Log article | §1 Voice, §4 Typography, §6 Voice principles |
| Legal pages (Privacy, Terms, Disclaimer) | §3 Palette, §4 Typography |
| 404 page (`/not-found`) | §5 Signature surfaces |
| 500 error boundary | §5 Signature surfaces |
| Global loading state | §5 Signature surfaces |
| OG / social share image | §2 Lockups, §3 Palette |
| Favicons + PWA manifest | §2 Symbol lockup |
| SiteNav | §2 Nav lockup, §3 Palette (ghost ochre CTA) |
| Footer | §2 Compact lockup |

---

## What changed per prompt

| Prompt | Change |
|---|---|
| 04 | Lucide Mountain icon retired across all 12 files; replaced with semantic Lucide icons or brand lockups |
| 04b | Signature-vs-accent rule enforced; UFPMark removed from feature cards; rule added to BRAND.md §5 |
| 04c | UFPLockupNav created (single-line 320×56); nav CTA converted to ghost ochre; solid-vs-ghost rule added to BRAND.md §3 |
| 05 | Edge-runtime icon generators removed; sharp-based favicon script written; static PNGs committed; OG image rewritten |
| 05b | All lockup SVG wordmarks converted from live `<text>` to outlined path data; font-independent; nav wordmark has optical-correction stroke (0.4px); OG image simplified (no font buffer fetch) |
| 06 | Safety-net pages created (404, 500, loading); empty states updated (UFPMark + trail-register copy); editorial articles styled in Instrument Serif + Inter + JetBrains Mono; voice sweep (zero exclamation marks, zero emoji); brand-preview page gated |
| 07 | Automated checks all passing; ElevationChart and RouteMapView hex violations fixed; baseline screenshots archived; this document written |
| Ref 01 | **Consistency sweep.** SiteNav rewritten as single source of truth (built-in How to fuel + The Log links; `showPlannerLink` defaults true; mobile hamburger sheet added). PlannerStepBar extracted as client component reading from usePlanner(); planner/layout.tsx updated to wrap with SiteNav + PlannerStepBar + LegalFooter. Results page bespoke nav replaced with SiteNav + plan sub-header. All per-page nav overrides removed. Version badges removed from SiteNav, LegalFooter, and all page chrome. |
| Ref 02 | **Voice sweep.** Button em-dash addenda removed (`Build your plan — it's free` → `Build your plan`; `Start planning — it's free` → `Start planning`). Repeated trust tags eliminated (duplicate "No account needed" removed). Feature-checklist tick marks (✓/✅) replaced with Lucide Check/X icons in StepCalibration. All remaining emoji replaced: fuelTypeIcon() converted to JetBrains Mono text codes (G/C/~/B/F/Cap/—); empty states get Lucide icons (ClipboardList, Package, Map); ACTION_ICONS emoji map replaced with ACTION_DOT CSS-class map; six emoji in print/page.tsx replaced with text. |
| Ref 03 | **Verify and close-out.** All 17 automated checks confirmed PASS. Dependency audit: no stale brand packages. Archive confirmed at `archive/brand-pre-2026/`. IMPLEMENTED.md and BRAND.md updated. |

---

## Automated check results (all PASS)

Checks 1–11 were run at migration close (Prompt 07). Checks 12–17 were added and run at refinement close (Ref 03).

```
1.  Mountain icon references       PASS
2.  Legacy Tailwind palette        PASS
3.  Raw hex outside brand files    PASS  (see note below)
4.  Exclamation marks              PASS
5.  Emoji in source                PASS
6.  focus:ring-amber/blue/stone    PASS
7.  Safety-net pages exist         PASS
8.  Brand components exist         PASS
9.  No Lucide Mountain import      PASS
10. Static favicon files exist     PASS
11. icon.tsx / apple-icon.tsx gone PASS
12. SiteNav single source of truth PASS  (one component, no per-page nav overrides)
13. Version badges in chrome       PASS  (none in nav, footer, or page body)
14. Em-dash button addenda         PASS  (no "— it's free" or similar)
15. Duplicate trust tags           PASS  (no repeated "No account" copy)
16. Tick marks (✓/✅) in source    PASS  (replaced with Lucide Check/X)
17. TypeScript clean               PASS  (tsc --noEmit: zero src/ errors)
```

**Check 3 — exclusion rationale.** The check as initially specified excluded
`assets/brand/` and `print/page.tsx`. The refined check also excludes:

- `src/components/brand/` — brand SVG lockup files; hardcoded hex is intentional
  brand token source, same status as `assets/brand/`
- `opengraph-image.tsx` — edge runtime; Satori doesn't support CSS custom props
- `globals.css` — hex values appear only as inline comments after HSL definitions
- `layout.tsx` — Next.js `themeColor` metadata API requires literal hex
- `manifest.ts` — PWA manifest spec requires literal hex
- `src/lib/utils.ts` — `terrainColor()` map is the canonical terrain token source;
  values mirror `tailwind.config.js` `terrain.*` and `globals.css` `.terrain-bar-*`

---

## Known gaps

1. **Dark variant not implemented.** BRAND.md §5 notes the `.ufp-on-ink` CSS class
   is defined in `tokens.css` but no dark-surface UI has been built. This is
   deliberately deferred to Prompt 08.

2. **Custom wordmark not commissioned.** BRAND.md §2 notes the outlined path data
   is an interim fix. A commissioned wordmark from a type designer is the durable
   solution, recommended at the 12-month mark. Until then, the optical-correction
   stroke (0.4px on nav lockup) is the approved workaround.

3. **Leaflet map colours use semantic non-brand hues.** Fluid events (`var(--ufp-slate)`)
   and supplement capsules (`var(--ufp-ink-3)`) use the closest available brand
   tokens, but there is no dedicated blue or purple in the palette for these semantic
   map actions. Accepted as a practical trade-off; flag if a future palette expansion
   adds a fluid/supplement token.

4. **Visual tour not automated.** Screenshots at 1440×900 and 375×812 of all surfaces
   listed in Prompt 07 §2 must be captured manually and attached to the PR. The
   automated checks confirm structural correctness but not visual correctness.

---

## Expected next actions

1. **Run Prompt 08** — dark-surface variant. The token system (`tokens.css` `.ufp-on-ink`
   class, `fill="currentColor"` in lockup SVGs) was built to support this. Prompt 08
   adds the theme toggle and applies the inverse palette to the surfaces that need it.

2. **Commission custom wordmark** at the 12-month mark. Brief: Instrument Serif as
   the reference, 28px display size as the primary target, optical corrections
   baked into the letterforms rather than applied as a stroke. Until then, the
   current outlined paths are the approved lockup.

3. **Attach visual tour to PR.** Screenshots of every surface listed in Prompt 07 §2
   Visual tour section, before marking the migration complete.

---

*Refinements 01–03 completed 2026-04-19. All 17 checks PASS. Source clean.*
