# Baseline — pre Prompt 03a

Captured 2026-04-18 at 1440×900 via Chrome headless against the local dev server.
These are the **dark-theme before** shots. Prompt 03c diffs against these to
confirm the palette sweep closed regressions rather than introducing them.

| File | Route | State |
|------|-------|-------|
| `home.png` | `/` | Hero above-fold |
| `how-to-fuel.png` | `/how-to-fuel-an-ultra` | Editorial guide, top |
| `planner.png` | `/planner` | Step 1 — empty event form |
| `log.png` | `/log` | Index, one article tile |
| `print.png` | `/print` | Fallback ("No plan found") |

## Token verification (Prompt 02b)

Confirmed on `:root` at time of capture:

```
--ufp-paper:  #f4efe6   ✓
--ufp-ink:    #17140f   ✓
--ufp-ochre:  #c2691a   ✓
--ufp-ink-2:  #3a342a   ✓
--ufp-ink-3:  #6b6356   ✓
--font-display: 'Instrument Serif', 'Instrument Serif Fallback'  ✓
--font-mono:    'JetBrains Mono', 'JetBrains Mono Fallback'      ✓
```
