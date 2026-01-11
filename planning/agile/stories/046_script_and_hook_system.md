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
-   **Error Handling**: Each script can be assigned a `failPolicy` that determines how the experiment should react to a failure (e.g., abort, continue with error).
    - `ABORT_EXPERIMENT`: (default) Abort the experiment and raise an error.
    - `CONTINUE_WITH_ERROR`: Continue the experiment but raise an error.

-   **Architecture**: Ensure proper decoupling. The orchestration service shouldn't know the content of the script, just that it needs to run it.

## Acceptance Criteria
- [x] `ExperimentOrchestrator` registers all scripts from the Plan upon initialization.
- [x] Listeners correctly receive the event payload.
- [x] `processHook()` (or similar method) is implemented to bridge Node.js events to Python execution.
- [x] Python execution receives the correct `Context` data (serialized as JSON).
- [x] Script output/errors are captured and logged via the Logger service.
- [x] Experiment properly handles script errors for both `ABORT_EXPERIMENT` and `CONTINUE_WITH_ERROR` policies.
- [ ] Integration test verifies that a script attached to `EXPERIMENT_START` runs when the experiment starts.
- [ ] Integration test verifies that a script attached to `STEP_START` runs at the beginning of a step.
- [ ] Integration test verifies that a script attached to `STEP_END` runs at the end of a step.
- [ ] Integration test verifies that a script attached to `EXPERIMENT_END` runs when the experiment ends.
- [ ] Integration test verifies that a script attached to `BEFORE_TOOL_CALL` runs before a tool is called.
- [ ] Integration test verifies that a script attached to `AFTER_TOOL_CALL` runs after a tool is called.

## Dependencies
- Story 042 (Script Schema) - DONE
- Story 025 (Orchestrator Loop) - REVIEW (Must be integrated with loop events)
- Story 018 (Event Bus) - DONE
- Story 021 (Container Execution) - DONE

## Testing
1.  **Unit Test**: Mock `EventBus` and `ContainerPool`. Verify `initialize()` subscribes to events. Verify event emission triggers `execute()` on the container service. Test experiment properly handling script errors for both `ABORT_EXPERIMENT` and `CONTINUE_WITH_ERROR` policies.

2.  **Integration Test**:
    -   Create a Plan with a Script on `EXPERIMENT_START` that prints "Hello World EXPERIMENT_START".
    -   Launch Experiment.
    -   Check Logs for "Hello World EXPERIMENT_START".
    -   Create a Plan with a Script on `STEP_START` that prints "Hello World STEP_START".
    -   Launch Experiment.
    -   Check Logs for "Hello World STEP_START".
    -   Create a Plan with a Script on `STEP_END` that prints "Hello World STEP_END".
    -   Launch Experiment.
    -   Check Logs for "Hello World STEP_END".
    -   Create a Plan with a Script on `EXPERIMENT_END` that prints "Hello World EXPERIMENT_END".
    -   Launch Experiment.
    -   Check Logs for "Hello World EXPERIMENT_END".
    -   Create a Plan with a Script on `BEFORE_TOOL_CALL` that prints "Hello World BEFORE_TOOL_CALL".
    -   Launch Experiment.
    -   Check Logs for "Hello World BEFORE_TOOL_CALL".
    -   Create a Plan with a Script on `AFTER_TOOL_CALL` that prints "Hello World AFTER_TOOL_CALL".
    -   Launch Experiment.
    -   Check Logs for "Hello World AFTER_TOOL_CALL".
