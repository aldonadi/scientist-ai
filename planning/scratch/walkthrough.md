# Walkthrough - Script & Hook System (Story 046)

## Summary
Implemented the Script & Hook System to allow user-defined Python scripts to execute on experiment lifecycle events.

## Changes Made

### Schema Updates
- **script.schema.js**: Added `failPolicy` (ABORT_EXPERIMENT/CONTINUE_WITH_ERROR), `executionMode` (SYNC/ASYNC), and `BEFORE_TOOL_CALL`/`AFTER_TOOL_CALL` hook types.
- **event-bus.js**: Added `BEFORE_TOOL_CALL` and `AFTER_TOOL_CALL` event types.

### Orchestrator Integration
- **Script Registration**: `initialize()` registers listeners for each script's `hookType`.
- **executeHook()**: Executes scripts in containers, passing context (experiment, environment, event) and merging environment changes back.
- **_handleHookEvent()**: Routes SYNC (await) vs ASYNC (fire-and-forget) execution.
- **BEFORE/AFTER_TOOL_CALL**: Events emitted around tool execution in `processRole()`.

## Verification

### Unit Tests (9 passed)
```
PASS  src/services/experiment-orchestrator-hooks.test.js
  ✓ should register hooks during initialization
  ✓ should execute hook script and merge environment changes
  ✓ should pass correct context to container
  ✓ should throw on ABORT_EXPERIMENT policy
  ✓ should continue on CONTINUE_WITH_ERROR policy
  ...
```

### Integration Tests (8 passed)
```
PASS  src/services/experiment-orchestrator-hooks-integration.test.js
  ✓ EXPERIMENT_START hook
  ✓ STEP_START hook
  ✓ STEP_END hook
  ✓ EXPERIMENT_END hook
  ✓ BEFORE_TOOL_CALL hook
  ✓ AFTER_TOOL_CALL hook
  ✓ Multiple hooks registration
  ✓ Hook environment modification
```

**Total: 23 tests passed across 3 test suites.**
