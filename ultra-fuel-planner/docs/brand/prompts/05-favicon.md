# Prompt 05 — Favicon family, manifest, OG metadata

**Goal:** wire the favicon pack, PWA manifest, and social-card metadata so
every link preview and browser tab shows the new mark.

**Why this matters:** per BRAND.md Section 08 recommendation, favicon + OG
are the highest-visibility touchpoints and cheapest to update. This prompt
deliberately sits *after* the logo retirement so favicons don't get reverted.

## Read first

- `docs/brand/BRAND.md` — §2 (Wordmark), §3 (Palette)
- `assets/brand/favicon/` — all five SVG sources
- `assets/brand/avatar/ochre.svg` — primary social avatar

## What to do

### 1. Generate PNG rasters from the favicon SVGs

SVG favicons are well-supported but PNG fallbacks are still required for
iOS, Android, and older browsers. Convert:

```
assets/brand/favicon/favicon-16.svg          → public/favicon-16.png   (16×16)
assets/brand/favicon/favicon-32.svg          → public/favicon-32.png   (32×32)
assets/brand/favicon/favicon-64.svg          → public/favicon-64.png   (64×64)
assets/brand/favicon/favicon-128.svg         → public/favicon-128.png  (128×128)
assets/brand/favicon/apple-touch-icon.svg    → public/apple-touch-icon.png (180×180)
assets/brand/favicon/apple-touch-icon.svg    → public/android-chrome-192.png (192×192, scaled)
assets/brand/favicon/apple-touch-icon.svg    → public/android-chrome-512.png (512×512, scaled)
```

Also generate a legacy `.ico`:
```
public/favicon.ico   ← multi-resolution ICO containing 16/32/48 rendered from favicon-32.svg
```

Use whatever tool is idiomatic for the project (`sharp`, `svgo` + `ico-endec`,
a one-off script). Don't check in a binary conversion tool.

### 2. Wire the manifest

Create or update `public/site.webmanifest`:

```json
{
  "name": "Ultra Fuel Planner",
  "short_name": "UFP",
  "description": "Route-aware fuelling for ultra-distance runners.",
  "icons": [
    { "src": "/android-chrome-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#f4efe6",
  "background_color": "#f4efe6",
  "display": "standalone",
  "start_url": "/"
}
```

Note: `theme_color` is paper, not ochre. The chrome should recede — the
product is the content.

### 3. Head tags

Make sure the root HTML (`_document.tsx`, `index.html`, `app.html`, whatever
the project uses) has:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#f4efe6">
```

Remove any previous favicon references (there will almost certainly be
leftovers — `favicon.ico` in random sizes, a 2023-era `apple-touch-icon.png`,
Windows tile meta tags).

### 4. OG + social metadata

Update the site-wide OpenGraph defaults and Twitter card metadata:

```html
<meta property="og:title" content="Ultra Fuel Planner">
<meta property="og:description" content="Route-aware fuelling for ultra-distance runners.">
<meta property="og:image" content="https://ultrafuelplanner.com/og/default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://ultrafuelplanner.com/og/default.png">
```

The `/og/default.png` should already exist from Prompt 04's OG generator update.
If it doesn't, fail this prompt and go fix Prompt 04 first.

### 5. Verify

Run the app locally and:
- Open a fresh incognito tab, load any page, verify the favicon shows in the
  tab strip (not the cached old one).
- Paste a staging/preview URL into Slack and Twitter's card validator
  (<https://cards-dev.twitter.com/validator>). Screenshot both.
- Open DevTools → Application → Manifest and verify the manifest loads
  without errors.

## Deliverable

Branch `brand/05-favicon`. PR titled `brand: favicon, manifest, OG metadata`.

## Success criteria

- All eight PNGs + `favicon.ico` exist in `public/`
- `site.webmanifest` validates (no console errors)
- Slack unfurl preview shows the new OG image and mark
- Every `<head>` tag above is present; no legacy favicon references remain
- Screenshots of Slack unfurl + Twitter card preview in the PR
