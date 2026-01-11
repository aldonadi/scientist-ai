# Walkthrough - Orchestrator Step Loop (Story 025)

I have implemented the core execution loop for the `ExperimentOrchestrator`, enabling the system to run experiments step-by-step, manage lifecycle events, and handle termination conditions.

## Changes

### 1. `ExperimentOrchestrator` Implementation
-   **Step Loop**: Implemented `runLoop()` to iterate through experiment steps.
-   **Step Processing**: Implemented `processStep()` to handling `STEP_START` and `STEP_END` events and role iteration.
-   **Goal Evaluation**: Added `evaluateGoals()` logic (basic structure for now) to check for experiment success.
-   **Termination Logic**: Added checks for `maxSteps` and met goals, updating the experiment status to `COMPLETED` or `FAILED` appropriately.

### 2. Unit Tests
Created `backend/src/services/experiment-orchestrator.service.test.js` covering:
-   **Initialization**: Verifies the loop starts correctly.
-   **Max Steps**: Verifies the experiment fails if `maxSteps` is exceeded.
-   **Goal Termination**: Verifies the experiment completes if a goal is met.
-   **Role Iteration**: Verifies that roles are processed within each step.
-   **Error Handling**: Verifies graceful failure upon errors.

## Verification Results

### Automated Tests
Run command: `npm test -- src/services/experiment-orchestrator.service.test.js`

```
 PASS  src/services/experiment-orchestrator.service.test.js
  ExperimentOrchestrator Step Loop
    ✓ should initialize and start the loop (17 ms)
    ✓ should increment steps up to maxSteps and fail (11 ms)
    ✓ should terminate early if a goal is met (7 ms)
    ✓ should iterate through roles in each step (4 ms)
    ✓ should handle errors in loop gracefully (72 ms)
```

All 5 tests passed successfully.
