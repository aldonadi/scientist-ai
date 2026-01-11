# Implement Script & Hook System

- **Status:** NOT READY
- **Points:** 5
- **Story ID:** 046
- **Type:** Feature

## Description
Implement the mechanism to register and execute Scripts defined in an `ExperimentPlan`. Scripts are pieces of Python code attached to lifecycle events (Hooks) like `EXPERIMENT_START` and `STEP_START`. This story covers the backend infrastructure to listen to the `EventBus`, invoke the Python execution environment, and pass the appropriate context.

## User Story
**As a** Developer,
**I want** the system to execute Python scripts when specific events occur,
**So that** I can extend experiment behavior with custom logic (e.g., dynamic logging, environment modification) without changing the core engine.

## Technical Requirements
-   **Script Registration**: In `ExperimentOrchestrator.initialize()`, iterate through `ExperimentPlan.scripts` and register listeners on the `EventBus` for each matching `hookType`.
-   **Context Construction**: When an event fires, construct a `Context` object containing:
    -   `experiment`: Read-only metadata.
    -   `environment`: A deep copy of the current environment (or mutable reference if allowed).
    -   `event`: The payload of the event that triggered the hook.
-   **Execution**: Use `containerPool.service` (or `executionEnv` interface) to run the `script.code` in a container.
-   **Error Handling**: If a script fails (non-zero exit code), it should be logged but should NOT crash the experiment unless critical (implementation detail: define policy, likely `CONTINUE_WITH_ERROR`).
-   **Architecture**: Ensure proper decoupling. The orchestration service shouldn't know the content of the script, just that it needs to run it.

## Acceptance Criteria
- [ ] `ExperimentOrchestrator` registers all scripts from the Plan upon initialization.
- [ ] Listeners correctly receive the event payload.
- [ ] `processHook()` (or similar method) is implemented to bridge Node.js events to Python execution.
- [ ] Python execution receives the correct `Context` data (serialized as JSON).
- [ ] Script output/errors are captured and logged via the Logger service.
- [ ] Integration test verifies that a script attached to `EXPERIMENT_START` runs when the experiment starts.
- [ ] Integration test verifies that a script attached to `STEP_START` runs at the beginning of a step.

## Dependencies
- Story 042 (Script Schema) - DONE
- Story 025 (Orchestrator Loop) - REVIEW (Must be integrated with loop events)
- Story 018 (Event Bus) - DONE
- Story 021 (Container Execution) - DONE

## Testing
1.  **Unit Test**: Mock `EventBus` and `ContainerPool`. Verify `initialize()` subscribes to events. Verify event emission triggers `execute()` on the container service.
2.  **Integration Test**:
    -   Create a Plan with a Script on `EXPERIMENT_START` that prints "Hello World".
    -   Launch Experiment.
    -   Check Logs for "Hello World".
