# Implementation Plan - Experiment Orchestrator Initialization

This plan addresses User Story 024: Orchestrator Initialization. It focuses on creating the `ExperimentOrchestrator` service, loading the experiment and plan context, and firing the initial start event.

## User Review Required

> [!NOTE]
> This is a foundational service. It will initially only handle startup. The step loop and complex logic come in later stories (025+).

## Proposed Changes

### Backend

#### [NEW] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

-   Create `ExperimentOrchestrator` class.
-   **Constructor**: Accepts `experimentId`.
-   **Dependencies**:
    -   `Experiment` (Model)
    -   `ExperimentPlan` (Model)
    -   `EventBus` (Service)
    -   `LoggerService` (Service)
-   **Methods**:
    -   `initialize()`:
        -   Fetches `Experiment` by ID.
        -   Fetches linked `ExperimentPlan`.
        -   Initializes `EventBus`.
        -   Attaches `LoggerService` to the bus.
        -   Sets `this.experiment` and `this.plan` state.
    -   `start()`:
        -   Emits `EXPERIMENT_START`.
        -   Does NOT start the step loop yet (that is Story 025).

#### [MODIFY] [app.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)

-   (Optional) May need to export or register the Orchestrator if we were verifying it via API, but for this story, unit tests are sufficient. We won't modify `app.js` unless we need a route to trigger it, which `017_api_launch_experiment` might have already covered or will need.
    -   *Correction*: Story 017 "Launch Experiment API" is DONE. It probably just creates the database record. I should check if it calls the orchestrator. If not, I won't wire it up fully in `app.js` yet, just unit test the class.

## Verification Plan

### Automated Tests

-   Create `backend/tests/services/experiment-orchestrator.service.test.js`.
-   Use `jest` to mock `Experiment`, `ExperimentPlan`, and `EventBus`.
-   **Test Case 1: Initialization**:
    -   Verify it loads the experiment and plan correctly.
-   **Test Case 2: Start Event**:
    -   Call `start()`.
    -   Verify `EventBus.emit` was called with `EXPERIMENT_START`.
-   **Run Command**:
    ```bash
    cd backend
    npm test tests/services/experiment-orchestrator.service.test.js
    ```

### Manual Verification

-   None required for this backend-only logic, as we rely on the unit test to verify the emitted events and state loading.
