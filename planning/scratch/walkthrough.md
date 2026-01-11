# Walkthrough - Experiment Control API (Story 047)

Implemented the Experiment Control API to allow users to Pause, Resume, and Stop experiments. This feature adds a new endpoint and robust state management to the Experiment Orchestrator.

## Changes

### 1. API Endpoint
- **`POST /api/experiments/:id/control`**
    - Accepts `{ command: "PAUSE" | "RESUME" | "STOP" }`.
    - Validates state transitions to prevent illegal actions (e.g., Resuming a Completed experiment).
    - Returns updated status.

### 2. Experiment Orchestrator
- Updated `start()` to respect existing `startTime` when resuming.
- Updated `Experiment` model to include `STOPPED` status.
- Orchestrator loop checks status on every iteration to exit gracefully on `PAUSE` or `STOP`.

## Verification Results

### Automated Tests
Ran comprehensive integration tests covering the full state transition matrix.

**Command:** `npm test src/routes/experiment.control.test.js`

| Initial State | Command | Result |
| :--- | :--- | :--- |
| **RUNNING** | PAUSE | ✅ PAUSED |
| **PAUSED** | RESUME | ✅ RUNNING |
| **RUNNING** | STOP | ✅ STOPPED |
| **INITIALIZING** | STOP | ✅ STOPPED |
| **FAILED** | RESUME | ✅ ERROR (400) |
| **COMPLETED** | PAUSE | ✅ ERROR (400) |

Full test suite passed:
```text
PASS  src/routes/experiment.control.test.js
PASS  src/services/experiment-orchestrator.service.test.js
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
```

### Manual Verification
The implementation is purely backend logic enclosed by integration tests. No UI exists for this yet (Story 035), so manual UI verification is N/A.
