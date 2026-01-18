# Walkthrough - Debugging BlackJack Experiment

Successfully diagnosed and fixed all issues preventing the BlackJack experiment from functioning correctly.

## Issues Fixed

### 1. Backend Crash (Docker Permissions)
Hook event handlers executed asynchronously without error handling.
- **Fix**: Added `emitAsync()` to `EventBus` and `await` lifecycle events in orchestrator

### 2. Hook Environment Not Updating
The `BEFORE_TOOL_CALL` hook was running but `num_tool_calls` stayed at 0.

**Bug A: `exec()` Namespace** - Python's `exec(user_code)` doesn't populate `locals()` with defined functions
- **Fix**: Pass explicit namespace dict to `exec()` and check that dict for `run`

**Bug B: `DotDict` Returning Copies** - Nested dicts returned as new copies, not in-place
- **Fix**: Convert nested dicts in-place with `self[key] = DotDict(val)`

### 3. Tool Environment Not Updating
The `increment` tool defined `execute(env, args)` but was never called.

**Bug A: No Execution Wrapper** - Tool code was run as raw script without calling `execute()`
- **Fix**: Added Python wrapper that `exec()`s the tool code, calls `execute(env, args)`, and outputs modified env as JSON

**Bug B: Stale Environment** - Tool received `filteredEnv` (copied before hooks ran) instead of current state
- **Fix**: Pass `this.experiment.currentEnvironment.variables` to tool wrapper

**Bug C: No Error Logging** - JSON parse failures were silent
- **Fix**: Added `[TOOL]` log entry when tool output isn't valid JSON

## Files Modified

- [event-bus.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/event-bus.js) - Added `emitAsync()`
- [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js) - Hook/tool execution wrappers, logging

## Verification

Both environment variables now update correctly:

![BlackJack Success](file:///home/andrew/.gemini/antigravity/brain/47568ae7-5e58-4de6-bc65-4cac66f1cd25/blackjack_verification_final_1768700722483.png)

- `num_tool_calls: 7` ✅ (hook working)
- `current_sum: 20` ✅ (tool working)
- Role Activity shows tool calls ("Calling tool: increment", etc.)
