# Finite architecture

Finite is intentionally split so the web MVP can become a Swift app later without rewriting the product logic.

## Layers

- `src/core/life.ts`
  - Pure date/time and life-cost calculations.
  - No React, DOM, browser storage, network calls, or Next.js imports.
  - Swift port target: `FiniteCore` structs/functions.

- `src/core/state.ts`
  - Versioned JSON state model for profile, reflections, values, and cost items.
  - The persisted shape is `schemaVersion: 1` and is covered by tests.
  - Swift port target: `Codable` models with the same field names.

- `src/app/finite-app.tsx`
  - Web shell only: onboarding, tabs, localStorage adapter, and UI.
  - It calls the core layer instead of embedding calculations in views.

## Current storage

The MVP is local-first and saves one JSON object under:

```text
finite.state.v1
```

Example shape:

```json
{
  "schemaVersion": 1,
  "profile": {
    "birthDate": "1990-01-01",
    "expectedLifespanYears": 80,
    "selectedValues": ["Family", "Health"]
  },
  "costItems": [
    {
      "id": "cost_1",
      "title": "Scrolling",
      "durationMinutes": 120,
      "frequency": "daily",
      "worthIt": "sometimes"
    }
  ],
  "reflections": [
    {
      "date": "2026-06-11",
      "answer": "mostly",
      "tags": ["Family"],
      "note": "Dinner together"
    }
  ]
}
```

## Swift app path

When building the Swift app:

1. Port `src/core/life.ts` to pure Swift first.
2. Mirror `src/core/state.ts` as `Codable` structs.
3. Reuse the JSON schema and test fixtures before writing SwiftUI views.
4. Use SwiftUI views as a thin shell over the same concepts:
   - `TodayView`
   - `LifeCalendarView`
   - `CostsView`
   - `ValuesView`
5. Keep sync/accounts optional and outside the core layer.

## Guardrails

- Keep calculations out of React components.
- Keep persisted state versioned.
- Add tests for any new core behavior before changing UI.
- Avoid backend assumptions until the local-first MVP proves the concept.
