# State History Tab Implementation Plan

Implement a State History tab in the Experiment Monitor to visualize environment variable evolution across steps.

## User Review Required
> [!IMPORTANT]
> **Data Volume Concern**: Storing a full snapshot of the environment for every step could be data-intensive. We are implementing a separate collection `ExperimentStateHistory` to store these snapshots, linked to the Experiment ID. This avoids the 16MB document limit of MongoDB but still requires monitoring for very long experiments.

> [!NOTE]
> **Column Configuration**: We will persist column configuration in `localStorage` so the user's view preference is saved across sessions.

## Proposed Changes

### Backend

#### [NEW] [history.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/history.model.js)
- Define `ExperimentStateHistorySchema`.
- Fields: `experimentId`, `stepNumber`, `timestamp`, `environment` (Mixed).
- Index on `{ experimentId: 1, stepNumber: 1 }`.

#### [MODIFY] [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)
- Add `getExperimentHistory(req, res)` method.
- Fetch status of usage.

#### [MODIFY] [experiment.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/experiment.routes.js)
- Add route `GET /:id/history` pointing to `experimentController.getExperimentHistory`.

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Import `ExperimentStateHistory`.
- In `processStep()`:
    - After `STEP_END` event emission (ensuring all hooks checked), create and save a new `ExperimentStateHistory` document.
    - Deep copy the `currentEnvironment.variables`.

### Frontend

#### [NEW] [state-history.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor/state-history.component.ts)
- Component to display the history table.
- **Inputs**: `experimentId`.
- **State**: `historyData`, `columns`, `sortOrder`, `autoRefresh`.
- **Logic**:
    - Poll `/api/experiments/:id/history` every 5s if experiment running.
    - specialized logic for column management (add/remove/deep-key).
    - Horizontal scroll container.

#### [MODIFY] [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor/experiment-monitor.component.ts)
- Add "State History" tab.
- Embed `<app-state-history>` when tab is active.

## Verification Plan

### Automated Tests
- **Backend Model Test**: Verify `ExperimentStateHistory` schema and saving.
- **Backend API Test**: Verify `GET /history` returns correct sorted data.
- **Orchestration Test**: Verify `processStep` creates a history record.

### Manual Verification
1.  Run the "Lemonade Stand" experiment (which has state changes).
2.  Open "State History" tab.
3.  Verify table populates with steps as they occur (every 5s).
4.  Test sorting (reverse chronological).
5.  Test Column Config:
    - Remove a column.
    - Add a new column (e.g., a nested key if available, or just a different top-level var).
    - Reload page -> Verify config persists.
6.  Test Export to CSV.
