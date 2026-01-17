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

- **API Check**: Confirmed "BlackJack" plan exists in DB with correct `rules`, `goals`, `scripts`, and `initialEnvironment`.

## Bug Fix: Environment Data Binding

Addressed issue where Environment variables were lost when switching tabs before saving.

### Root Cause
The `PlanEditorComponent` used `*ngIf` to validly display only the active tab. This caused the `EnvironmentTabComponent` to be destroyed when switching to other tabs (like Roles or Scripts). Consequently, its internal state (specifically the `variables` array which tracks data types and validation state) was lost. The parent component only held a "flat" key-value object via two-way binding, which was insufficient to reconstruct the full typed schema required by the backend, leading to empty or invalid environment payloads on save.

### Fix Implementation
1.  **State Preservation**: Replaced `*ngIf` with `[class.hidden]` in `PlanEditorComponent`. This keeps all tab components instantiated and alive in the DOM (hidden via CSS), allowing them to retain their internal state regardless of visibility.
2.  **Direct State Access**: Implemented `@ViewChild(EnvironmentTabComponent)` in the parent `PlanEditorComponent`. The `save()` method now directly queries the child component's authoritative state to construct the payload, ensuring accurate variable types and values are sent to the backend without relying on lossy inference or potentially stale events.

### Verification
- **Test Case**: Created "EnvTest" plan. Added numeric variable `test_var=123`. Switched tabs. Saved.
- **Result**: `test_var` was correctly persisted to the database.

### Tab Persistence Verification
Verified that other tabs also retain state:
- **Roles**: Added "Role1", switched tabs, returned. Role remained in list.
- **Scripts**: Added script code, switched tabs, returned. Code content was preserved.
- **Goals**: Added goal, switched tabs, returned. Goal description and condition were preserved.

This confirms the architectural fix robustly handles state management for the entire Plan Editor.

### Bug Fix: Input Focus Loss
- **Issue**: Typing in Goals/Scripts inputs caused focus loss after 1 character.
- **Root Cause**: `*ngFor` loops lacked `trackBy`, causing full DOM re-render on every keystroke when parent component updated the array reference.
- **Fix**: Added `trackByIndex` to `GoalsTabComponent` and `ScriptsTabComponent`.
- **Verification**: Browser test confirmed "test" could be typed without interruption.

### Bug Fix: Goal Evaluation Scope
- **Issue**: Experiment Failed with `Error: name 'env' is not defined`.
- **Root Cause**: Python `eval` was called with `env` dict as locals, which exposes keys as variables but does NOT expose the variable `env` itself for dot notation.
- **Fix**: Wrapped `env` dict in `SimpleNamespace` (recursive) and passed it as `{'env': env_obj}` to `eval` locals. This allows `env.money` syntax to work.
- **Update**: Replaced `SimpleNamespace` with custom `DotDict` class because `SimpleNamespace` breaks `env.get()` calls. `DotDict` inherits from `dict` but adds `__getattr__`, supporting both `env.prop` and `env.get('prop')`.

render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/plan-editor.component.ts)
render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/roles-tab.component.ts)
render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/provider.routes.js)
render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)
