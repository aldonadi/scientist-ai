# Walkthrough - Debugging BlackJack Experiment

I have successfully diagnosed and fixed the BlackJack experiment issue where the model appeared to "do nothing" while the step counter incremented aimlessly.

## Issues Found

### 1. Backend Crash (Docker Permissions)
The backend process crashed when Docker containers failed to connect (`EACCES /var/run/docker.sock`). This was caused by:
- **Root Cause**: Hook event handlers were executed asynchronously without proper error handling
- **Fix**: Added `emitAsync()` to `EventBus` and updated `ExperimentOrchestrator` to `await` lifecycle events

### 2. Hook Environment Not Updating
The `BEFORE_TOOL_CALL` hook was executing but `num_tool_calls` stayed at 0:

**Bug A: `exec()` Namespace**
- Python's `exec(user_code)` doesn't populate `locals()` with defined functions
- **Fix**: Pass explicit namespace dict to `exec(user_code, exec_namespace)` and check that dict for `run`

**Bug B: `DotDict` Returning Copies**  
- `DotDict.__getattr__` returned `DotDict(val)` for nested dicts (a new copy)
- Mutations via `context.environment['key'] = value` modified the copy, not the original
- **Fix**: Convert nested dicts in-place: `self[key] = DotDict(val)` before returning

**Bug C: Incorrect `deepCopy` Usage**
- `deepCopy()` from `environment.schema.js` expects full Environment objects, not just variables
- **Fix**: Use `JSON.parse(JSON.stringify(...))` for simple variable dict cloning

## Files Modified

- [event-bus.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/event-bus.js) - Added `emitAsync()`
- [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js) - Multiple fixes for hook execution

## Verification

The experiment now correctly updates environment variables:

![BlackJack Success](file:///home/andrew/.gemini/antigravity/brain/47568ae7-5e58-4de6-bc65-4cac66f1cd25/blackjack_experiment_success_1768699088848.png)

`num_tool_calls` incremented from 0 → 5 over 15 seconds, confirming the `BEFORE_TOOL_CALL` hook correctly modifies the environment.
