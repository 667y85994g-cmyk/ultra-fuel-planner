# Prompt 07 — Verification + closeout

**Goal:** confirm the migration is complete and nothing has drifted back.
Catch leftover debt, produce a handoff note, archive the old brand assets.

**Why this step:** brand migrations half-finish quietly. A verification pass
forces a pass/fail result and surfaces any regressions before they ship.

## Read first

- `docs/brand/BRAND.md` — full file
- `docs/brand/audit-2026-Q2.md`
- The previous six PRs (brand/01 through brand/06) — skim descriptions

## What to do

### 1. Automated checks

Run and attach the output to the PR description:

```bash
# Zero Lucide mountain references
grep -rn "Mountain\b\|MountainSnow" src/ app/ components/ pages/ || echo "PASS"

# Zero legacy palette references
grep -rn "stone-\|amber-\|bg-black\|bg-white\|text-black\|text-white" src/ app/ components/ pages/ || echo "PASS"

# Zero raw hex except in the canonical tokens files
grep -rn "#[0-9a-fA-F]\{6\}" src/ app/ components/ pages/ \
  | grep -v "assets/brand/\|docs/brand/" || echo "PASS"

# Zero exclamation marks in user-facing copy
grep -rn "!" src/copy/ content/ i18n/ || echo "PASS"

# Zero emoji in source
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/ app/ components/ || echo "PASS"
```

Any FAIL result must be fixed in this PR before it merges.

### 2. Visual tour

Capture screenshots at 1440×900 of these surfaces, all in one doc:

- Landing / marketing home
- Planner (empty state)
- Planner (populated with a sample route)
- Account / settings
- Login, signup, forgot password
- 404, 500
- OG image preview (just the PNG)
- Mobile: landing, planner, login (375×812)

Attach to the PR as a single gallery. If anything looks off, open an issue
with the screenshot — don't fix it silently in this PR.

### 3. Dependency audit

Check `package.json`:

- `lucide-react` (or equivalent): still needed? If yes, list the icons still
  in use. If no, remove.
- Any CSS-in-JS library, Stitches, etc.: compatible with the token system?
- Tailwind: v3 or v4? If v4, verify the `@theme inline` block has our tokens.

### 4. Archive the old brand

Move any legacy brand files (old logo PNGs, old favicons, `brand-old/` if it
exists) to `archive/brand-pre-2026/`. Commit the move. This is for historical
reference, not live use.

### 5. Write the handoff

Create `docs/brand/IMPLEMENTED.md` with:

- Date the migration completed
- List of surfaces covered
- List of surfaces intentionally deferred (if any, with rationale)
- Known open issues
- Next expected action (per BRAND.md Section 08 step 6 of the Recommended
  path — the custom wordmark commission)

## Deliverable

Branch `brand/07-verify`. PR titled `brand: verification + closeout`.

## Success criteria

- All five automated checks return PASS
- Visual tour attached to the PR with zero obviously-broken surfaces
- `docs/brand/IMPLEMENTED.md` exists and is accurate
- `archive/brand-pre-2026/` holds the retired assets
- Dependency audit shows no stale brand-related packages
