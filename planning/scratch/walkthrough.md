# Walkthrough: Story 035 - Experiment Monitor UI

## Summary

Implemented the comprehensive "Scientist" dashboard for monitoring running experiments. This 8-point story adds a full-featured experiment monitor with a 3-panel layout.

## Changes Made

### New Components

#### [log-feed.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/log-feed.component.ts)

Reusable log feed component with:
- Color-coded log entries by source type (system=gray, role=blue, tool=green, error=red)
- Timestamp formatting
- Auto-scroll behavior that disables when user scrolls up
- Optional data payload display

#### [json-tree.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/json-tree.component.ts)

Expandable JSON tree viewer with:
- Collapsible object and array nodes
- Syntax highlighting (keys=purple, strings=green, numbers=blue, booleans=orange)
- First-level auto-expansion
- Click to toggle expand/collapse

### Modified Components

#### [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts)

Complete rewrite with:
- **Header**: Status badge, step counter, experiment ID
- **Controls**: Pause/Resume/Stop buttons connected to `ExperimentService`
- **3-Panel Layout**:
  - Left: Live log feed using LogFeedComponent
  - Center: Role activity (thinking, tool calls)
  - Right: Environment inspector using JsonTreeComponent
- **Polling**: Auto-refreshes every 2 seconds while running
- **Result Banner**: Shows completion status with result message

render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts)

### Exports

#### [index.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/index.ts)

Added exports for new components.

## Verification

### Build Status
```
✔ Building...
Application bundle generation complete. [9.017 seconds]
Exit code: 0
```

### Acceptance Criteria
| Criterion | Status |
|-----------|--------|
| Shows current status/step | ✅ |
| 3-panel layout (Logs, Activity, Environment) | ✅ |
| Log feed component | ✅ |
| JSON tree view for environment | ✅ |

## Next Steps

- **Story 036**: Implement SSE streaming to replace polling with real-time updates
- Manual testing with a running experiment

## Debugging: Plan Creation Flow

Resolved `400 Bad Request` / `500 Internal Server Error` preventing "BlackJack" plan creation.

### Problems Identified
1.  **Missing Provider**: The backend has no `Provider` records, and `Role.modelConfig.provider` is required. No API existed to create/fetch providers.
2.  **Schema Mismatches**:
    - Frontend sent `initialEnvironment` as flat object; Backend requires `{ variables, variableTypes }`.
    - Frontend sent `condition` (via `conditionScript`); Backend required `condition`.
    - Frontend sent lowercase enum values (`sync`, `abort`); Backend required uppercase (`SYNC`, `ABORT`).
    - Frontend sent `hook` instead of `hookType`.

### Soltutions Implemented
1.  **Provider Seeding**:
    - Created `backend/seed_provider.js` to insert a default "Local Ollama" provider.
    - Added `[GET] /api/providers` endpoint to the backend (`provider.controller.js`, `provider.routes.js`, `app.js`).
2.  **Frontend Fixes**:
    - Updated `PlanEditorComponent`:
        - Fetches providers on init.
        - Transforms `initialEnvironment` payload (infers `variableTypes` from value types).
        - Maps `conditionScript` to `condition` and ensures correct Script enum values.
    - Updated `RolesTabComponent`:
        - Updated `modelConfig.provider` to be a dropdown populated by the API (uses ObjectId).

### Verification
- **Browser Run**: Successfully navigated to `/plans/new`, filled form, and saved.
- **API Check**: Confirmed "BlackJack" plan exists in DB with correct `rules`, `goals`, `scripts`, and `initialEnvironment`.

render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/plan-editor.component.ts)
render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/roles-tab.component.ts)
render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/provider.routes.js)
render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)
