# Implement Experiment Control API (Pause/Resume/Stop)

- **Status:** DONE
- **Points:** 5
- **Story ID:** 047
- **Type:** Feature

## Description
Implement the API endpoints and orchestrator logic to allow external control of a running experiment. Users need to be able to Pause (halt after current step), Resume (continue from paused state), and Stop (abort immediately) an experiment.

## User Story
**As a** User,
**I want** to pause and resume my experiments,
**So that** I can inspect the state, fix issues, or free up resources without losing progress.

## Technical Requirements
-   **API Endpoint**: `POST /api/experiments/:id/control`
    -   Body: `{ command: "PAUSE" | "RESUME" | "STOP" }`
-   **Orchestrator Logic**:
    -   **Pause**: The loop in `ExperimentOrchestrator` must check the status *before* starting the next step. If `PAUSED`, it should exit the loop gracefully but NOT mark as Completed/Failed.
    -   **Resume**: The `start()` method (or a new `resume()` method) must handle picking up an experiment that is in `PAUSED` state (loading state, ensuring step count is correct).
    -   **Stop**: Force termination. Orchestrator should set status to `STOPPED` (or `FAILED` with specific result) and emit `EXPERIMENT_END`.
-   **Concurrency**: The orchestrator must respect status changes made by the API. (Addressed by mitigation in Story 025 to refresh state).

## Acceptance Criteria
- [x] `POST /api/experiments/:id/control` endpoint implemented.
- [x] Validates command enum (`PAUSE`, `RESUME`, `STOP`).
- [x] `PAUSE` command transitions status to `PAUSED` (if currently `RUNNING`).
- [x] `RESUME` command transitions status to `RUNNING` (if currently `PAUSED`) and triggers resumption of the Orchestrator loop.
- [x] `STOP` command transitions status to `STOPPED` and terminates execution.
- [x] Disallowed transitions are handled gracefully (e.g., cannot `RESUME` a `COMPLETED` experiment).
- [x] Integration Test: Launch experiment, Pause it, Verify it stops processing steps. Resume it, verify it continues. Stop it, verify it ends.

## Dependencies
- Story 025 (Orchestrator Loop) - REVIEW
- Story 017 (Launch Experiment API) - DONE

## Testing
1.  **API Test**: Send valid and invalid commands to the endpoint.
2.  **State Transition Test**: Verify allowed transitions (e.g., cannot `RESUME` a `COMPLETED` experiment). Verify proper handling of every disallowed transition.
3.  **Orchestrator Integration**:
    -   Start a long-running experiment (high `maxSteps`).
    -   Send `PAUSE`. Wait. Check that step count stops increasing.
    -   Send `RESUME`. Check that step count resumes increasing.
    -   Send `STOP`. Check that status becomes `STOPPED`.

## Review
**1/11/26**: Accepted by Product Owner