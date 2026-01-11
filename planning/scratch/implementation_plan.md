# Implementation Plan: Fix Orchestrator Step Loop

Address critical findings from Third-Party Review 02 regarding the Orchestrator Step Loop (Story 025).

## User Review Required

> [!IMPORTANT]
> This plan addresses "Immediate Fixes" only. The script registration and control API are deferred to new stories 046 and 047.

## Proposed Changes

### Backend Service

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

-   **Refactor `processStep`**:
    -   Pass `this.experiment.currentEnvironment` (snapshot) in `STEP_END` event payload.
-   **Refactor `runLoop`**:
    -   Refresh `this.experiment` from DB at the start of each iteration (`Experiment.findById`).
    -   Check `status` after refresh; if not `RUNNING`, break loop.
    -   Calculate `duration` (endTime - startTime) when setting `COMPLETED` or `FAILED`.
    -   Include `duration` in `EXPERIMENT_END` payload.
    -   Emit `EXPERIMENT_END` (with failure result) in the `catch` block (replace TODO).
-   **Refactor `evaluateGoals`**:
    -   Wrap evaluation in `try/catch` that *rethrows* or returns explicit error, rather than swallowing it.
    -   Orchestrator loop should handle the error (fail experiment).
-   **Logging**:
    -   Replace all `console.error` calls with `this.logger.log()`.

### Backend Tests

#### [MODIFY] [experiment-orchestrator.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/services/experiment-orchestrator.service.test.js) (Assuming exists, or create new if not)

-   **New Test Cases**:
    1.  **Concurrency**: Simulate DB status change to `PAUSED`/`STOPPED` while loop is running; verify loop terminates.
    2.  **Event Payloads**: Verify `STEP_END` indicates snapshot and `EXPERIMENT_END` includes duration.
    3.  **Goal Error**: Simulate a Goal evaluation throwing an error; verify Experiment fails.
    4.  **Save/DB Error**: Mock `save()` throwing error; verify handled gracefully.

## Verification Plan

### Automated Tests
-   Run unit tests for orchestrator:
    ```bash
    npm test backend/tests/services/experiment-orchestrator.service.test.js
    ```

### Manual Verification
-   Review `planning/reviews/02/REVIEW_ANALYSIS.md` to ensure all "Immediate Fixes" are covered.
