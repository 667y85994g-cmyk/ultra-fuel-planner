# Setup — once, before any prompt runs

You'll run this sequence from the UFP repo root with Claude Code. Do it in order.
Each prompt is scoped to a single PR. Don't merge several together — the point is
that each one is independently reviewable and revertable.

## 1. Copy the brand-pack into the repo

```bash
mkdir -p docs/brand assets/brand
cp -r /path/to/brand-pack/* docs/brand/

# Assets that will be served by the app go into assets/brand/
mv docs/brand/logo       assets/brand/logo
mv docs/brand/favicon    assets/brand/favicon
mv docs/brand/avatar     assets/brand/avatar
mv docs/brand/tokens.css assets/brand/tokens.css
```

Final layout:

```
docs/brand/
  BRAND.md              ← canonical reference, read by every prompt
  tailwind.tokens.js    ← Tailwind extension, imported by tailwind.config
  fonts-head.html       ← <head> snippet for font + favicon imports
  prompts/              ← the ordered sequence below

assets/brand/
  tokens.css            ← imported by app entry
  logo/*.svg            ← primary, stacked, compact, symbol, symbol-inverse, wordmark
  favicon/*.svg         ← favicon-16/32/64/128, apple-touch-icon
  avatar/*.svg          ← ochre, ink, paper
```

## 2. Create a feature branch per prompt

One branch per prompt, one PR per branch. Sequence:

- `brand/01-audit`      → read-only, produces an audit note
- `brand/02-tokens`     → installs tokens + fonts, no UI changes yet
- `brand/03-palette`    → sweeps palette, replaces stone/amber/etc.
- `brand/04-logo`       → retires Lucide mountain, deploys lockups
- `brand/05-favicon`    → favicon + OG + manifest
- `brand/06-long-tail`  → 404, auth screens, empty states, microcopy
- `brand/07-verify`     → verification pass

## 3. How to run each prompt

Open Claude Code in the repo root. Paste the contents of the numbered prompt file.
The prompts assume Claude Code has read access to `docs/brand/BRAND.md` and to
`assets/brand/` — each prompt will re-read those files as needed.

If Claude Code asks for anything beyond what's in the prompt, the prompt is
probably missing context — send me the question and I'll tighten it.
