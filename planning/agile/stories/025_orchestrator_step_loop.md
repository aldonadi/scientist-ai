# Implement Experiment Step Loop

- **Status:** READY
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
- [ ] `processStep()` logic is implemented.
- [ ] Emits `STEP_START` at beginning of step.
- [ ] Iterates through all Roles defined in the plan (delegating to prompt/inference logic).
- [ ] Emits `STEP_END` at end of step.
- [ ] Evaluates all Goals after step completion.
- [ ] Increments `currentStep`.
- [ ] Respects `maxSteps` and handles termination.
- [ ] Updates `Experiment.status` correctly.

## Testing
1.  Run a dummy loop with 0 roles.
2.  Verify step counter increments.
3.  Verify `STEP_START`/`STEP_END` events are emitted.
4.  Verify Goal evaluation terminates loop correctly.

## Review Log
