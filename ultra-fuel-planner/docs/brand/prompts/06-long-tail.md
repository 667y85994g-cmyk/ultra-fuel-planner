# Prompt 06 — The long tail: auth, 404, empty states, microcopy, email

**Goal:** migrate the under-attended surfaces that give away a half-finished
brand migration. Typography pass, microcopy pass, and visual checks on the
ten or so pages nobody usually looks at.

**Why this matters:** a user judges brand consistency by the worst surface
they see. A perfect homepage and a stone-950/amber-500 password reset page
tells a story about whether the brand is real.

## Read first

- `docs/brand/BRAND.md` — §4 (Typography), §6 (Voice)
- `docs/brand/audit-2026-Q2.md` — the "Long tail" section

## Surfaces to touch

Work through this list in order. For each, check palette, typography, lockup,
and voice. Commit per logical chunk (auth is one commit, error pages another).

### Auth

- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`
- Use `UFPLockupStacked` above the form, centred.
- Form fields: ink-2 text, paper-3 border, focus ring in ochre. No blue
  focus rings.
- Submit button: ochre background, paper text, square-ish radius (4px).
- Error messages: clay colour (not red-500).
- **Voice check:** "Sign in" not "Log in". "Send reset link" not "Send
  password reset email". "Check your inbox" not "A verification email has
  been sent to you". See BRAND.md §6 — active not passive.

### Error pages

- `/404`, `/500`
- Centred layout. `UFPMark` above the message. H1 in Instrument Serif.
- Copy: one line describing what happened, one line with a concrete action.
- 404: "This page doesn't exist. Try [the planner] or [the home page]."
- 500: "Something's off on our end. Try again in a minute, or
  [contact us]." Do not apologise in ochre-coloured hyperbole.

### Empty states

For every empty state in the app (no routes yet, no fuel plans yet, no
favourites yet, etc.):

- Small `UFPMark` at roughly 48px, ochre-soft tint (opacity 0.5).
- Title in Instrument Serif (20–24px), body in Inter.
- A single primary CTA in ochre. If there's no obvious next action, use
  a link in ink, not a button.

### Loading states

- Skeletons in paper-2 / paper-3, not the Tailwind default grey.
- If there's a spinner, it's The Profile rotating on the apex dot, OR
  just the ochre dot pulsing. Not a generic spinner.

### Email templates

Every transactional email: welcome, password reset, weekly summary, etc.

- Header: `UFPLockupCompact` on a paper background.
- Body: Inter (or email-safe fallback — Helvetica Neue). Numbers in
  the email-safe mono fallback (Consolas / Menlo / Courier).
- Footer: Instrument Serif wordmark small, address, unsubscribe in
  ink-3. No emoji.

### Marketing pages

- `/pricing`, `/about`, any landing pages
- Follow the primary brand treatment. If there's marketing copy, pass
  it through the voice principles (BRAND.md §6) — strip exclamation
  marks, strip hyperbole, prefer concrete.

### PDF / CSV exports

- If the app exports a fuel plan as a PDF or CSV: add the stacked lockup
  to the PDF header, paper background, ink text. Don't style the CSV —
  it's a data file.

## What not to do

- Don't rewrite anything that doesn't need rewriting. Voice passes mean
  tightening, not wholesale replacement.
- Don't add emoji anywhere. Ever. (BRAND.md §6.)
- Don't touch legal pages (privacy, terms). Those are lawyer territory —
  raise them separately if they need it.

## Deliverable

Branch `brand/06-long-tail`. PR titled `brand: auth, errors, emails, long tail`.

## Success criteria

- Every surface in the audit's "Long tail" section renders in the new system
- Email templates preview cleanly in Gmail + Apple Mail + Outlook web
- Zero exclamation marks in user-facing copy (grep should prove it)
- Zero emoji in user-facing copy (grep should prove it)
- Screenshots of each surface in the PR description, one per surface
