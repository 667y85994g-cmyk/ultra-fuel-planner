# Prompt 03 — Migrate the palette

**Goal:** replace every occurrence of the old palette with new brand tokens.
One PR, mechanical sweep, zero token decisions made in this step — all decisions
are already encoded in the mapping table below.

**Why one PR:** keeping the sweep atomic means the visual diff is attributable
to one commit. If something goes wrong, revert is trivial.

## Read first

- `docs/brand/BRAND.md` — §3 Palette and §8 Don'ts
- `docs/brand/audit-2026-Q2.md` — the hotspot file list from the audit

## The mapping (canonical)

Apply this mapping everywhere. Do not invent new mappings. If a value doesn't
appear in the table, stop and flag it in the PR description as an "unmapped
colour" — do not guess.

### Surface
```
stone-950    → ink
stone-900    → ink-2
stone-800    → ink-2
stone-700    → ink-3
stone-500    → ink-3
stone-400    → ink-4
stone-300    → paper-dim
stone-200    → paper-3
stone-100    → paper-2
stone-50     → paper
white, #fff  → paper
black, #000  → ink
```

### Accent
```
amber-500    → ochre
amber-600    → ochre-hover
amber-400    → ochre-soft
amber-300    → ochre-soft
yellow-*     → ochre         (flag in PR desc — inspect case-by-case)
orange-*     → ochre         (flag in PR desc — inspect case-by-case)
```

### Status / signal
```
red-*        → clay
green-*      → forest
blue-*       → slate
cyan-*, teal-*, indigo-*  → slate    (flag in PR desc)
```

### Neutrals that shouldn't be in the codebase at all
```
slate-*, gray-*, zinc-*, neutral-*  → map to ink scale based on darkness
```

For Tailwind class names: `bg-stone-950` → `bg-ink`, `text-stone-500` → `text-ink-3`,
`border-stone-200` → `border-paper-3`, and so on.

For raw hex values in CSS/inline styles: look up the old hex, map to the token,
replace with `var(--ufp-*)`.

## What to do

1. Sweep all files under `src/`, `app/`, `components/`, `pages/`, `styles/`
   (or whatever the repo's equivalents are — use the audit).
2. Apply the mapping. Commit once the sweep is complete.
3. Remove the old palette entries from `tailwind.config.{js,ts}` — delete the
   `stone`, `amber`, and any other Tailwind-default palette extension.
   The Tailwind defaults remain available to Tailwind, but should no longer
   be referenced in our code.
4. Run the app's existing typecheck, lint, and tests. Fix any that break
   because of class-name changes (typical culprits: snapshot tests).
5. Screenshot the three highest-traffic pages (landing, planner, account)
   and attach to the PR.

## What not to do

- Don't change layout, spacing, typography, or component structure.
- Don't introduce new colours that aren't in the mapping.
- Don't fix other bugs along the way. If you spot one, open an issue.
- Don't touch third-party component styling (Stripe, Clerk, etc.) — those
  get their own PR later.

## Deliverable

Branch `brand/03-palette`. PR titled `brand: migrate palette from stone/amber to paper/ink/ochre`.

## Success criteria

- `grep -r "stone-\|amber-\|#fff\|#000\|#ffffff\|#000000" src/ app/ components/`
  returns zero results (or only intentional exceptions documented in the PR)
- Typecheck and lint pass
- Existing test suite passes (snapshot updates allowed and expected)
- Three-screenshot visual before/after in the PR description
- PR description lists every "unmapped colour" encountered with file path
  and my proposed resolution for each
