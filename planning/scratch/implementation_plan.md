# Implementation Plan - Orchestrator Step Loop (Story 025)

## Goal
Implement the main execution loop in `ExperimentOrchestrator` to manage the lifecycle of experiment steps, including event emission, sequential role execution, and goal-based termination.

## User Review Required
> [!NOTE]
> This story focuses on the *loop structure* and *lifecycle events*. The actual Role Prompt/Inference (Story 026) and Tool Execution (Story 027) logic will be stubbed or minimal within the role iteration to be filled in by subsequent stories.

## Proposed Changes

### Backend

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
-   Refactor `start()` to initiate the step processing loop.
-   Implement `processStep()`:
    -   Emit `STEP_START`.
    -   Iterate `plan.roles` and call a `processRole(role)` stub (to be implemented fully in Story 026).
    -   Emit `STEP_END`.
    -   Call `evaluateGoals()`.
    -   Increment `currentStep`.
    -   Check `maxSteps` and update status.
    -   Persist `Experiment` state.
-   Implement `evaluateGoals()`:
    -   Iterate `plan.goals`.
    -   Evaluate `conditionScript` (using basic `eval` or `vm` for now, or placeholder if strict security needed immediately, but `vm` is standard for this within Node). *Note*: The SPEC mentions `Script` and `Goal` using Python logic in some places, but `Goal.conditionScript` might be simple boolean. SPEC section 2.1 says "Script ... Python". SPEC section 12.2 says "Goal Evaluation ... Execute conditionScript...".
    -   **Decision**: For providing a working nodejs prototype, I will assume the condition script is Python and needs to use the execution engine?
    -   *Correction*: SPEC says "Goal... conditionScript: String (Python boolean expression)".
    -   *Wait*: If it's pure Python, I need `Container` or `IExecutionEnvironment` to evaluate it.
    -   *Constraint*: Story 025 is "Orchestrator Step Loop". Story 028 is "Goal Evaluation Logic". Story 025 *also* says "Evaluates all goals".
    -   *Strategy*: I will implement the *structure* of calling `evaluateGoals`. Inside `evaluateGoals`, since strict Python execution requires the Container system (which I verified is ready but not integrated), I will *mock* the evaluation or use a simple hack for *this* story if the goal script is simple, OR I'll attempt to use the `Container` if easy.
    -   *Refined Strategy*: Since Story 028 exists for "Goal Evaluation Logic", I will implement the loop that *calls* `this.evaluateGoals()`, and implementations `evaluateGoals` to return `false` (or basic check) until Story 028 is implemented.
    -   *Re-reading Story 025 Acceptance Criteria*: "Evaluates all Goals after step completion." -> "Verify Goal evaluation terminates loop correctly."
    -   *Conclusion*: I must implement enough logic to pass the test. I will implement a basic evaluator that handles simple cases or mocks it for the test.

#### [NEW] [experiment-orchestrator.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.test.js)
-   Unit tests for `ExperimentOrchestrator`.
-   Mock `EventBus` and `Experiment`/`ExperimentPlan` models.
-   Test cases:
    -   Loop runs and increments steps.
    -   Stops at `maxSteps`.
    -   Stops when Goal is met (mocked evaluation result).
    -   Emits correct events.

## Verification Plan

### Automated Tests
-   Run `npm test backend/src/services/experiment-orchestrator.service.test.js`
-   (Note: I need to ensure `jest` is set up to run this).

### Manual Verification
-   None required for this backend logic story, automated tests should suffice.
