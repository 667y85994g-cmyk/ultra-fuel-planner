# Prompt 01 — Audit the current brand surface

**Goal:** produce a written audit of what needs to change, before touching any code.
This prompt is read-only. Do not edit files, do not run migrations, do not open PRs.

**Why this step:** a brand migration that starts with "change colours" misses
roughly half the surface area. We want a complete inventory first so we know what
"done" looks like.

## Read first

Read `docs/brand/BRAND.md` in full. This is the canonical reference — the system
it describes is what we're migrating *to*. Everything in the current repo is the
*from* state.

## What to audit

Produce a file at `docs/brand/audit-2026-Q2.md` with the following sections. Use
the exact headings so downstream prompts can grep for them.

### Stack
Framework (Next.js / Vite / Remix / etc.), Tailwind version if any, CSS strategy,
icon library, font loading approach. Three sentences, no more.

### Current palette usage
Grep for: `stone-`, `amber-`, `slate-`, `zinc-`, `gray-`, raw hex values in
components, `#000`, `#fff`, any hard-coded colour. For each colour family, list
the top 5 files by occurrence count. Don't list every match — we want the hotspots.

### Current typography
Every `font-family` declaration, every `font-*` Tailwind class in use, every
imported font. Flag any font-family that isn't Inter, Instrument Serif, or
JetBrains Mono.

### Lucide mountain occurrences
Every file that imports or renders `Mountain`, `MountainSnow`, or any mountain-y
icon from `lucide-react` (or `lucide-vue`, etc.). Include file path + line number.
These are the retirement targets for Prompt 04.

### Logo / brand surfaces
Every place the current logo or product name appears prominently. Navbar, auth
screens, emails, OG image template, loading states, error pages, PWA manifest,
favicon references in `<head>`.

### Long tail
404 page, 500 page, empty states, loading skeletons, auth screens
(login / signup / forgot password / email verification), onboarding, paywall,
in-app notifications, email templates. List each with its file path. These
surfaces get forgotten in brand migrations — flagging them now.

### Risks + open questions
Things that will be awkward to migrate. Third-party components that impose their
own styling (Stripe Elements, Clerk, Supabase Auth, etc.). Anywhere the current
brand leaks through an API response (SVG in a PDF export, embed code for sharing).
No more than 10 items.

## Deliverable

Commit the audit file to the `brand/01-audit` branch. Open a PR titled
`brand: audit current surface (read-only)`. Don't merge yet — I want to review
the audit before the next prompt runs.

## Success criteria

- `docs/brand/audit-2026-Q2.md` exists with all seven sections
- Zero code changes outside that one file
- Every section has concrete file paths, not just categories
