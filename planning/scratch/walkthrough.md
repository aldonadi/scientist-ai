# Walkthrough - Experiment Orchestrator Initialization

I have implemented the `ExperimentOrchestrator` service, which is responsible for the lifecycle of an experiment. This covers the initialization phase, including loading the experiment and plan from the database and setting up the event bus.

## Changes

### 1. [NEW] ExperimentOrchestrator Service

Created `backend/src/services/experiment-orchestrator.service.js`.

-   **Initialization**: Loads `Experiment` and `ExperimentPlan` by ID.
-   **Event Bus**: Instantiates a private `EventBus` and `Logger` for the experiment.
-   **State Management**: Ensures the experiment has an initial environment populated from the plan.
-   **Start**: Emits the `EXPERIMENT_START` event.

### 2. [NEW] Unit Tests

Created `backend/tests/services/experiment-orchestrator.service.test.js`.

-   **Coverage**:
    -   Successful initialization.
    -   Error handling for missing IDs.
    -   Idempotency of `initialize()`.
    -   Verification of `EXPERIMENT_START` event emission.
    -   Status updates to `RUNNING`.

## Verification Results

### Automated Tests

Ran `npm test tests/services/experiment-orchestrator.service.test.js` and all tests passed.

```
PASS  tests/services/experiment-orchestrator.service.test.js
  ExperimentOrchestrator Service
    constructor
      ✓ should throw error if experimentId is missing (26 ms)
      ✓ should initialize properties correctly (3 ms)
    initialize
      ✓ should load experiment and plan successfully (4 ms)
      ✓ should throw error if experiment not found (3 ms)
      ✓ should throw error if plan not found (3 ms)
      ✓ should populate initial environment if empty (3 ms)
      ✓ should be idempotent (2 ms)
    start
      ✓ should initialize if not already initialized (15 ms)
      ✓ should update experiment status to RUNNING (3 ms)
      ✓ should emit EXPERIMENT_START event (3 ms)
```
