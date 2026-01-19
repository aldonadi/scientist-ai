# Script System Upgrade - Walkthrough

## Summary
Implemented a significant upgrade to the Script system enabling richer experiment behaviors:
1. **Hook Context Injection**: Scripts receive hook-specific data via `context['hook']`
2. **Script Actions API**: 8 actions for controlling experiment flow
3. **Quick Reference Panel**: Frontend UI showing available context and actions

## Changes Made

### Backend ([experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js))

render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

**Key additions:**
- `_controlFlow` object for tracking stop/pause/skip/endStep signals
- `_buildHookContext()` - constructs hook-specific context for 12 hook types
- `_processScriptActions()` - handles 8 action types with proper logging
- Updated `processStep()`, `processRole()`, `runLoop()` for control flow

### Frontend ([scripts-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts))

render_diffs(file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts)

**Key additions:**
- `HOOK_CONTEXT_FIELDS` - per-hook context field definitions
- `ACTIONS_REFERENCE` - all available actions with descriptions
- Collapsible Quick Reference panel showing context and actions

## Hook Context Fields

| Hook | Available Fields |
|------|------------------|
| `STEP_START` | `step_number` |
| `BEFORE_TOOL_CALL` | `tool_name`, `args` |
| `TOOL_RESULT` | `tool_name`, `result`, `env_changes` |
| `EXPERIMENT_END` | `result`, `duration` |

## Actions API

```python
actions.log(message, data=None)        # Write log entry
actions.stop_experiment(success, msg)  # Stop as SUCCESS/FAILURE
actions.pause_experiment()             # Pause experiment
actions.end_step(immediate=False)      # End step early
actions.skip_role()                    # Skip current role
actions.set_variable(key, value)       # Set env variable
actions.inject_message(role, content)  # Inject message
actions.query_llm(prompt, system, model)  # LLM query (TODO)
```

## Validation

- ✅ Backend tests pass (`npm test`)
- ✅ Frontend builds successfully (`npm run build`)
- ⏳ Manual testing recommended for action behaviors

# State History Tab - Walkthrough

## Summary
Implemented a new **State History** tab in the Experiment Monitor that allows users to track the evolution of environment variables across each step of an experiment.

## Changes Made
- **Backend**:
  - Created `ExperimentStateHistory` model to store snapshots.
  - Updated `ExperimentOrchestrator` to save state at the end of every step.
  - Added `GET /api/experiments/:id/history` endpoint.
- **Frontend**:
  - Created `StateHistoryComponent` with:
    - Dynamic column management (add/remove/reset).
    - Polling for live updates (5s interval).
    - Client-side sorting and CSV Export.
  - Integrated tab into `ExperimentMonitorComponent`.

## Verification
Verified end-to-end using browser automation with a live "BlackJack" experiment.
- Confirmed step snapshots are created.
- Confirmed table updates in real-time.
- Confirmed Export to CSV works.

![Verification Recording](/home/andrew/.gemini/antigravity/brain/2fd790e2-53e3-4146-8f13-7b3f5f79a974/verify_state_history_1768794920365.webp)
