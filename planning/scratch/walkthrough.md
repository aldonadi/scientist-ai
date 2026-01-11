# Walkthrough - Goal Evaluation Logic Options (Story 028)

I have implemented the goal evaluation logic in `ExperimentOrchestrator` to enable experiments to terminate when success conditions are met.

## Changes

### 1. experiment-orchestrator.service.js

- Imported `ContainerPoolManager`.
- Implemented `evaluateGoals()` method.
- Added logic to acquire a container, execute a Python script that evaluates the goal condition (`goal.conditionScript`) using `eval()` against the current environment, and parse the JSON result.
- Integrated error handling and logging for evaluation failures.

### 2. experiment-orchestrator.service.test.js

- Created comprehensive unit tests mocking `ContainerPoolManager`, `Container`, and `Experiment` state.
- Verified:
    - Success case (Condition True).
    - Failure case (Condition False).
    - Environment Variable Injection.
    - Error Handling (Python Syntax Error, Container Crash).

## Verification Results

### Automated Tests
Run `npm test src/services/experiment-orchestrator.service.test.js` in `backend` directory.

```
 PASS  src/services/experiment-orchestrator.service.test.js
  ExperimentOrchestrator Goal Evaluation
    ✓ should return null if no goals defined in plan (6 ms)
    ✓ should return null if condition evaluates to false (3 ms)
    ✓ should return goal description if condition evaluates to true (4 ms)
    ✓ should pass correct environment variables and condition to container (3 ms)
    ✓ should handle Python execution errors gracefully (throw and log) (42 ms)
    ✓ should handle Container execution failures (exit code != 0) (4 ms)
```
