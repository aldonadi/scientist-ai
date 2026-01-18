# Implementation Plan - Fix Hook Execution Logic

## Goal Description
The "BlackJack" experiment fails to update its environment because the hook code uses a `def run(context):` pattern and expects dot-notation access (e.g., `context.environment`), neither of which is supported by the current `ExperimentOrchestrator` implementation. The goal is to update `executeHook` to support these patterns, ensuring the hook runs effectively.

## User Review Required
> [!NOTE]
> This change enhances the backend's Python wrapper for hooks. It acts as a polyfill to support more "pythonic" script writing (functions and dot notation) which the existing data expects.

## Proposed Changes

### Backend

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Update `executeHook` method's Python script wrapper.
- **Add `DotDict` class**: Copy the helper class from `evaluateGoals` to allow `context.environment` access.
- **Convert Context**: Convert the JSON-loaded `context` dict to a `DotDict`.
- **Invoke Run**: Add logic after `exec(user_code)` to check `if 'run' in locals() and callable(run): run(context)`.

## Verification Plan

### Automated Tests
- None existing for this specific edge case in unit tests (mocks would need deep update).
- **Verification via BlackJack Experiment**:
    - Restart backend.
    - Run "BlackJack" experiment via Browser Subagent.
    - **Success Criteria**:
        - `num_tool_calls` increments in the UI (0 -> 1 -> 2).
        - Logs show "Hook BEFORE_TOOL_CALL executed".
        - Experiment does not crash.
    - This implicitly verifies both the `DotDict` access (would crash otherwise) and `run()` invocation (would do nothing otherwise).

### Manual Verification
- The browser subagent run IS the manual verification.
