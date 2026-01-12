# Implement Experiment Step Loop

- **Status:** DONE
- **Points:** 8
- **Story ID:** 025
- **Type:** Feature

## Description
Implement the main loop of the orchestrator to manage the lifecycle of an experiment step. This includes event emission, role iteration, and goal evaluation.

## User Story
**As a** User,
**I want** the experiment to proceed in steps,
**So that** agents can interact sequentially and the system can evaluate progress.

## Technical Requirements
-   **Event Loop**: Iterate until termination or `maxSteps`.
-   **Events**: Emit `STEP_START` and `STEP_END` via `EventBus`.
-   **Goal Evaluation**: After each step, iterate through `ExperimentPlan.goals`.
    -   Execute `conditionScript` for each goal against `currentEnvironment`.
    -   If a goal returns `true`, terminate the experiment with `COMPLETED`.
-   **Safety**: Check `currentStep > maxSteps`. If so, terminate with `FAILED` (Max Steps Exceeded).
-   **Status Updates**: Manage `Experiment.status` transitions.

## Acceptance Criteria
- [x] `processStep()` logic is implemented.
- [x] Emits `STEP_START` at beginning of step.
- [x] Iterates through all Roles defined in the plan (delegating to prompt/inference logic).
- [x] Emits `STEP_END` at end of step.
- [x] Evaluates all Goals after step completion.
- [x] Increments `currentStep`.
- [x] Respects `maxSteps` and handles termination.
- [x] Updates `Experiment.status` correctly.

## Testing
1.  Run a dummy loop with 0 roles.
2.  Verify step counter increments.
3.  Verify `STEP_START`/`STEP_END` events are emitted.
4.  Verify Goal evaluation terminates loop correctly.

## Review Log
**1/10/26** - Accepted by Product Owner