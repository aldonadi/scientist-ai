# Implementation Plan - Goal Evaluation Logic (Story 028)

## Goal Description
Implement the logic to evaluate goal conditions for an experiment using the `ExperimentOrchestrator` and `ContainerPoolManager`. The system should iterate through defined goals, execute their python condition scripts in an isolated container, and update the experiment status if a goal is met.

## User Review Required
> [!IMPORTANT]
> This implementation utilizes `ContainerPoolManager` to execute python scripts for goal evaluation.
> It assumes obtaining a fresh container for each evaluation is acceptable for performance.
> It also assumes environment variables can fit within standard OS ARG_MAX limits when passed to the container, as we inject the entire environment state via `EXPERIMENT_ENV` variable.

## Proposed Changes

### Backend Services

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Update `evaluateGoals` method to:
    - Import `ContainerPoolManager`.
    - Iterate through `this.plan.goals`.
    - For each goal:
        - Acquire a container from `ContainerPoolManager`.
        - Construct a Python script that:
            - Loads environment variables from `os.environ`.
            - Evaluates the `goal.conditionScript` using these variables (using `eval`).
            - Prints the result as JSON.
        - Execute the script using `container.execute`.
        - Parse the result.
        - If `true`, return `goal.description`.
        - Destroy the container in a `finally` block.
- Ensure error handling logs failures but decides whether to abort or continue (will stick to throwing for now as invalid goals are critical).

## Verification Plan

### Automated Tests
- Create/Update unit tests for `ExperimentOrchestrator.evaluateGoals`.
- Use `jest` to mock `ContainerPoolManager` and `Container`.
- Verify:
    - Container acquisition and destruction.
    - Python script structure passed to execute.
    - Correct parsing of True/False results.
    - Error handling for invalid scripts.

### Manual Verification
- None required if unit tests are comprehensive, as this is backend logic.
