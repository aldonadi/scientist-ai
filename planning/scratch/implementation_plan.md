# Implementation Plan - Script & Hook System (Story 046)

## Goal Description
Implement the mechanism to register and execute Python scripts attached to lifecycle events. Scripts can mutate the environment and have configurable failure and execution policies.

## User Review Required

> [!IMPORTANT]
> **New Hook Types**: The story mentions `BEFORE_TOOL_CALL` and `AFTER_TOOL_CALL`. These are not currently in the `EventTypes` or `ScriptSchema`. I will add them.

> [!IMPORTANT]
> **Environment Mutation**: Scripts receive a deep copy of the environment. On successful completion, the modified environment is merged back into `Experiment.currentEnvironment`.

> [!IMPORTANT]
> **Execution Mode**: Adding `executionMode` (SYNC/ASYNC) to `ScriptSchema`. Default is `SYNC`. Async hooks fire-and-forget; sync hooks pause the experiment until completion.

---

## Proposed Changes

### Schema Updates

#### [MODIFY] [script.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/script.schema.js)
- Add `failPolicy` enum (`ABORT_EXPERIMENT`, `CONTINUE_WITH_ERROR`), default `ABORT_EXPERIMENT`.
- Add `executionMode` enum (`SYNC`, `ASYNC`), default `SYNC`.
- Add `BEFORE_TOOL_CALL` and `AFTER_TOOL_CALL` to `hookType` enum.

---

#### [MODIFY] [event-bus.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/event-bus.js)
- Add `BEFORE_TOOL_CALL` and `AFTER_TOOL_CALL` to `EventTypes`.

---

### Orchestrator Integration

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

1.  **Script Registration** (in `initialize()`):
    - Iterate `this.plan.scripts`.
    - For each script, call `this.eventBus.on(script.hookType, handler)`.
    - Store registered handlers for cleanup.

2.  **New Method: `executeHook(script, eventPayload)`**:
    - Acquire container from `ContainerPoolManager`.
    - Construct `Context` object: `{ experiment: {...}, environment: deepCopy, event: payload }`.
    - Build Python wrapper script that loads context from env var, executes `script.code`, and outputs modified environment as JSON.
    - Execute in container.
    - Parse output and merge environment changes.
    - Handle errors according to `script.failPolicy`.
    - Destroy container in `finally`.

3.  **Emit New Events**:
    - Emit `BEFORE_TOOL_CALL` before `container.execute(tool)` in `processRole`.
    - Emit `AFTER_TOOL_CALL` after tool result is received.

4.  **Synchronous Execution**:
    - For `SYNC` scripts, `await executeHook()`.
    - For `ASYNC` scripts, call `executeHook()` without awaiting (fire-and-forget with error logging).

---

## Verification Plan

### Unit Tests
- Mock `ContainerPoolManager` and `EventBus`.
- Verify `initialize()` registers listeners for each script.
- Verify `executeHook()` correctly passes context and merges environment.
- Verify `ABORT_EXPERIMENT` policy throws and stops experiment.
- Verify `CONTINUE_WITH_ERROR` policy logs but continues.

### Integration Tests
- Create plans with scripts on `EXPERIMENT_START`, `STEP_START`, `STEP_END`, `EXPERIMENT_END`, `BEFORE_TOOL_CALL`, `AFTER_TOOL_CALL`.
- Launch experiments and verify logs contain expected output.
