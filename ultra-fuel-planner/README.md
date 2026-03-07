# Ultra Fuel Planner

A route-aware fuelling planner for ultramarathons. Upload your GPX, add your fuel inventory, mark your aid stations, and get a practical, terrain-aware race-day plan.

## Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (custom endurance palette)
- **Recharts** (elevation profile, charts)
- **Radix UI** (accessible primitives)
- No database, no auth — local storage for MVP

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

App runs at `http://localhost:3000`.

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── planner/page.tsx      # Multi-step planner flow
│   ├── results/page.tsx      # Race plan output (4 views)
│   ├── print/page.tsx        # Printable race card
│   └── api/parse-gpx/        # Server-side GPX parsing endpoint
├── components/
│   ├── planner/              # Step components + elevation chart
│   └── results/              # Summary, Timeline, Segment, Carry views
├── lib/
│   ├── gpx-parser.ts         # GPX file parsing + elevation smoothing
│   ├── segmentation.ts       # Route segmentation + terrain classification
│   ├── fuelling-engine.ts    # Rules-based fuelling planner
│   ├── planner-store.tsx     # React context + state management
│   ├── storage.ts            # localStorage persistence + seed data
│   └── utils.ts              # Helpers, formatters, colour maps
└── types/index.ts            # All TypeScript interfaces
```

## Core logic

### GPX parsing (`src/lib/gpx-parser.ts`)
- Parses track points (trkpt, rtept, wpt)
- Applies 5-point moving average to smooth GPS elevation noise
- Calculates haversine distance, cumulative ascent/descent
- Builds downsampled elevation profile for charts
- Server-side version uses regex (no DOMParser) for API routes

### Route segmentation (`src/lib/segmentation.ts`)
Groups route into terrain blocks using gradient thresholds:

| Terrain | Gradient |
|---|---|
| Flat/runnable | ±3% |
| Rolling | 3–8% |
| Sustained climb | 8–15% |
| Steep climb | 15%+ |
| Runnable descent | 0 to -8% |
| Technical descent | steeper than -15% |

Pace is estimated using Naismith's rule (climb penalty) and a descent factor.

### Fuelling engine (`src/lib/fuelling-engine.ts`)
Rules-based planner. Each terrain type has:
- **Preferred fuel types** (scored and ranked)
- **Avoided fuel types** (enforced)
- **Fluid priority multiplier** (increases fluid emphasis on climbs)
- **Interval spacing** (fuelling events spaced further apart on technical terrain)

Key rules:
- Steep climb → liquids and gels only, no chewing
- Technical descent → no fuel events at segment start, fluid only
- Flat/runnable → best window for bars, chews, real food
- Late race (hour 6+) → high late-race tolerance score prioritised, sweet foods deprioritised
- Caffeine budget tracked across race to respect athlete limit

## Adjusting fuelling logic

All rules are in `src/lib/fuelling-engine.ts` in the `TERRAIN_RULES` object. Each terrain entry has these fields:

```typescript
{
  preferred: FuelType[],        // ordered by preference
  avoid: FuelType[],            // never scheduled here
  rationale: string,            // shown to user
  timingNote?: string,          // optional advice
  fluidPriorityMultiplier: number  // >1 = push fluids harder
}
```

The `DEFAULT_ASSUMPTIONS` in `src/types/index.ts` controls pace, intervals, and phase boundaries.

## Adding future features

The codebase is structured for extension:

- **Auth + database**: `planner-store.tsx` uses a simple context. Replace localStorage calls in `storage.ts` with API calls.
- **Saved profiles**: `AthleteProfile` and `FuelItem[]` types are ready for persistence.
- **Coach tool**: `EventPlan` can be shared via JSON; the planner is a pure function (`generatePlan`).
- **Wearable import**: `TrainingMetrics` type is defined in `types/index.ts`. Wire up to athlete profile for pace/carb refinement.
- **Strategy modes**: Add a `strategyMode: 'conservative' | 'moderate' | 'aggressive'` field to `PlannerAssumptions` and branch the scoring logic in `selectBestFuel`.

## Data model

Key interfaces (all in `src/types/index.ts`):

- `AthleteProfile` — weights, targets, preferences
- `FuelItem` — product data including terrain suitability and tolerance scores
- `RouteSegment` — classified terrain block with estimated pace and effort
- `AidStation` — checkpoint with resupply data
- `FuelScheduleEntry` — single fuelling event with time, item, rationale
- `CarryPlan` — fluid and item carry requirements between checkpoints
- `PlannerOutput` — full plan including summary, schedule, carry plans, warnings
