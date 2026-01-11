# Implement Experiment Control API (Pause/Resume/Stop)

## Goal Description
Implement the ability to Pause, Resume, and Stop a running experiment via a REST API. This involves updating the `ExperimentOrchestrator` to respect status changes and providing a new controller endpoint `POST /api/experiments/:id/control`.

## User Review Required
> [!IMPORTANT]
> The `launchExperiment` controller is being updated to actually **start** the `ExperimentOrchestrator` asynchronously. Previously it only created the database record. This is a functional change to `POST /api/experiments`.

## Proposed Changes

### Backend

#### [MODIFY] [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)
- Update `launchExperiment` to instantiate `ExperimentOrchestrator` and call `start()` asynchronously.
- Add `controlExperiment` function:
    - Validate command (`PAUSE`, `RESUME`, `STOP`).
    - Fetch Experiment.
    - **PAUSE**: Update status to `PAUSED`.
    - **STOP**: Update status to `STOPPED`, set `endTime`, set `result` to "Stopped by User".
    - **RESUME**: Update status to `RUNNING`. Instantiate `ExperimentOrchestrator` and call `start()`.
    - **Return Format**:
        - Success: `200 OK`, JSON: `{ success: true, oldStatus: "...", newStatus: "..." }`
        - Invalid Transition: `400 Bad Request`, JSON: `{ error: true, message: "Cannot transition form X to Y", oldStatus: "..." }`

#### [MODIFY] [experiment.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/experiment.routes.js)
- Add `POST /:id/control` route mapped to `controlExperiment`.

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Update `start()` methods:
    - Check if `experiment.startTime` is already set. If so, do not overwrite it (preserves original start time on Resume).
    - Ensure `initialize()` is idempotent and safe for resuming.

## Verification Plan

### Automated Tests
- **Integration Test**: Create `backend/src/routes/experiment.control.test.js`.
    - Use `mongodb-memory-server` and `supertest`.
    - Test `POST /control` with `PAUSE`: Verify DB status changes.
    - Test `POST /control` with `RESUME`: Verify DB status changes.
    - Test `POST /control` with `STOP`: Verify DB status and result.
    - Test invalid transitions (e.g., Resume a Completed experiment).
- **Unit Test**: `backend/src/services/experiment-orchestrator.service.test.js`
    - Verify `runLoop` exits when status changes to `PAUSED`.
    - Verify `start` does not reset `startTime` on resume.
    - **State Transition Matrix**:
        - Create a test that iterates through ALL possible states (`INITIALIZING`, `RUNNING`, `PAUSED`, `COMPLETED`, `FAILED`, `STOPPED`).
        - For each start state, try to apply every valid command (PAUSE, RESUME, STOP).
        - Assert that valid transitions update state correctly.
        - Assert that invalid transitions throw an error or return failure (logic to be centrally defined or tested).

### Manual Verification
- None required if integration tests pass, as this is a backend-only logic change.
