# Ultra Fuel Planner — Brand pack for Claude Code migration

This folder contains everything needed to migrate the UFP codebase to the
new brand system using Claude Code: canonical reference, design tokens,
logo assets, and a seven-step prompt sequence.

## What's in here

```
BRAND.md                 Canonical brand reference. Read by every prompt.
tokens.css               Design tokens as CSS custom properties.
tailwind.tokens.js       Tailwind theme extension (v3/v4 compatible).
fonts-head.html          <head> snippet for font + favicon imports.

logo/
  primary.svg            Horizontal primary lockup (hero, print, OG)
  stacked.svg            Vertical stacked (avatars, auth screens)
  compact.svg            Profile + two-line wordmark (navbar, footer)
  symbol.svg             Symbol only (favicon large, loader)
  symbol-inverse.svg     Symbol on ink surfaces
  wordmark.svg           Text-only wordmark (legal footers, rare)

favicon/
  favicon-16.svg         Simplified 3-peak for 16px
  favicon-32.svg         Simplified 5-peak for 32px
  favicon-64.svg         Mid-fidelity profile for 64px
  favicon-128.svg        Full-fidelity profile for 128px+
  apple-touch-icon.svg   iOS home screen tile (ochre background, 180px)

avatar/
  ochre.svg              Primary social avatar (burnt ochre)
  ink.svg                Secondary (ink background, ochre dot)
  paper.svg              Editorial (paper, for light surfaces)

preview.html             Open in a browser to see every asset at a glance

prompts/
  00-setup.md            How to prepare the repo — run this once
  01-audit.md            Read-only audit, produces audit-2026-Q2.md
  02-tokens.md           Install tokens + fonts, non-destructive
  03-palette.md          Mechanical palette sweep
  04-logo.md             Retire Lucide mountain, deploy lockups
  05-favicon.md          Favicon + manifest + OG metadata
  06-long-tail.md        Auth, errors, emails, microcopy
  07-verify.md           Verification, closeout, handoff doc
```

## How to use this pack

1. **Read `BRAND.md` yourself first.** Five minutes. It's the system.
2. **Follow `prompts/00-setup.md`** to land the pack in the repo.
3. **Open Claude Code** from the repo root and paste the prompts in order.
   Each prompt is its own PR. Merge only after reviewing.
4. **Don't skip 01.** The audit is boring but every later prompt references
   it. Skipping it turns the sweep into guesswork.

## Design decisions that are locked

Per the brand doc Section 08:

- Wordmark: **Instrument Serif, Title-Case.** No alternatives.
- Palette: paper / ink / ochre. No stone-950, no amber-500.
- Symbol: the twenty-vertex profile with the ochre apex dot.
- Radii: 2 / 4 / 8. No `rounded-full` on surfaces.
- No emoji. No exclamation marks. British English.

If Claude Code proposes changing any of the above, it's wrong — push back.

## Open questions worth holding

Not every decision is locked. Flag these if Claude Code surfaces them during
the migration:

- Which third-party UI components (Stripe Elements, Clerk, Supabase Auth)
  need custom theming to match. Scope in Prompt 06.
- Whether to self-host fonts now or wait. See `fonts-head.html` comment.
- Whether `/api/og` (or equivalent) needs a new runtime for the Instrument
  Serif font load in edge functions.

## Deliverable for Claude Code

Seven PRs, merged in order. Each independently revertable. After PR 07:
one brand migration complete, one `IMPLEMENTED.md` written, one year to the
custom wordmark commission (per brand doc Section 08 Step 6).
