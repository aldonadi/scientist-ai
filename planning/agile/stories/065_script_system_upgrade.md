# Script System Upgrade: Hook Context & Actions API

- **Status:** READY
- **Points:** 13
- **Story ID:** 065
- **Type:** Feature

## Description
Significantly enhance the Script system to enable richer experiment behaviors. This includes two major improvements:

1. **Hook Context Injection**: Each hook type now provides relevant contextual data to scripts (e.g., `BEFORE_TOOL_CALL` passes tool name, `STEP_START` passes step number, `TOOL_RESULT` passes tool name and result).

2. **Script Actions API**: Scripts can now affect experiment execution beyond just modifying environment variables, including stopping experiments, writing logs, ending steps early, skipping roles, and making hidden LLM calls.

## User Story
**As a** Script Author,
**I want** access to hook-specific context and powerful action APIs,
**So that** I can write scripts that make intelligent decisions based on the current experiment state and meaningfully control the experiment flow.

## Acceptance Criteria

### Part 1: Hook Context Injection
- [ ] All scripts receive a `hook_context` dict with hook-specific data
- [ ] `EXPERIMENT_START`: Provides `experiment_id`, `plan_name`
- [ ] `STEP_START`: Provides `step_number`
- [ ] `STEP_END`: Provides `step_number`, `environment_snapshot`
- [ ] `ROLE_START`: Provides `role_name`
- [ ] `MODEL_PROMPT`: Provides `role_name`, `messages` (mutable), `tools`
- [ ] `MODEL_RESPONSE_COMPLETE`: Provides `role_name`, `full_response`
- [ ] `BEFORE_TOOL_CALL`: Provides `tool_name`, `args`
- [ ] `TOOL_CALL`: Provides `tool_name`, `args`
- [ ] `TOOL_RESULT`: Provides `tool_name`, `result`, `env_changes`
- [ ] `AFTER_TOOL_CALL`: Provides `tool_name`, `result`
- [ ] `EXPERIMENT_END`: Provides `result`, `duration`
- [ ] Frontend Script editor shows a Quick Reference panel for the selected hook

### Part 2: Script Actions API
- [ ] `actions.stop_experiment(success=False, message=None)` - Ends experiment as SUCCESS or FAILURE
- [ ] `actions.log(message, data=None)` - Writes arbitrary log entry
- [ ] `actions.end_step(immediate=False)` - Ends current step (immediate or after hooks complete)
- [ ] `actions.skip_role()` - Skips current role, moves to next
- [ ] `actions.query_llm(prompt, system_prompt=None, model=None)` - Hidden LLM call, returns response
- [ ] `actions.pause_experiment()` - Pauses experiment (can be resumed via control API)
- [ ] `actions.set_variable(key, value)` - Syntactic sugar for env modification
- [ ] `actions.inject_message(role_name, content)` - Inject message into role's history
- [ ] Action results are captured in script output and processed by orchestrator
- [ ] Experiment correctly handles stop/end/skip signals during execution
- [ ] Calling `end_step()` in `STEP_END` hook logs warning and is ignored (prevent infinite loop)

## Technical Design

### Hook Context Structure
```python
# Available in scripts as context['hook'] dict
context['hook'] = {
    "type": "BEFORE_TOOL_CALL",        # Always present
    "tool_name": "calculate_sum",      # Hook-specific fields
    "args": {"a": 1, "b": 2}
}
```

### Actions API
```python
# Available in scripts as `actions` object
def run(context):
    # Stop experiment
    actions.stop_experiment(success=True, message="Goal achieved early!")
    
    # Write log
    actions.log("Custom checkpoint reached", {"step": context.experiment.currentStep})
    
    # End current step after remaining hooks
    actions.end_step(immediate=False)
    
    # Skip this role entirely
    actions.skip_role()
    
    # Query LLM (blocking)
    response = actions.query_llm(
        prompt="Analyze this data: " + str(context.environment),
        system_prompt="You are a data analyst",
        model="llama3:latest"  # Optional, uses default provider
    )
```

### Backend Implementation
1. Extend Python wrapper to expose `hook_context` and `actions` objects
2. Actions are collected in a `_pending_actions` list during script execution
3. Return pending actions as part of script output JSON
4. Orchestrator interprets actions after script completes and applies effects
5. Add new Event types or signals for control flow (STOP_REQUESTED, SKIP_ROLE, etc.)

### Frontend Implementation
1. Add collapsible "Quick Reference" panel to Scripts tab
2. Panel shows available `hook_context` fields for selected hook
3. Panel shows available `actions` methods with signatures

## Dependencies
- Story 046 (Script & Hook System) - DONE

## Testing
1. **Unit Tests**:
   - Test context injection for each hook type
   - Test each action method produces correct output format
   - Test orchestrator correctly interprets action signals

2. **Integration Tests**:
   - Test script using `hook_context.tool_name` in `BEFORE_TOOL_CALL`
   - Test `actions.stop_experiment()` terminates experiment
   - Test `actions.log()` creates log entry
   - Test `actions.end_step()` advances to next step
   - Test `actions.skip_role()` skips role processing
   - Test `actions.query_llm()` returns LLM response

3. **Manual Testing**:
   - Open Script editor, select different hooks, verify Quick Reference updates
   - Create script using `hook_context`, run experiment, verify context accessible
   - Create script using `actions.log()`, verify log entry appears

## Implementation Notes
- The `actions` object is a simple class that records calls without executing them
- All action effects happen after script execution completes (no early exit)
- The `query_llm` action is an exception: it blocks during script execution
- Consider rate limiting `query_llm` calls per script

## Open Questions for User Review
1. Should `actions.query_llm()` use the experiment's current provider or a dedicated "utility" provider?
2. For `actions.end_step(immediate=True)`, should remaining scripts in the current hook be skipped?
3. Should we add `actions.set_env(key, value)` as syntactic sugar or keep using `env[key] = value`?

## Review Log
- 2026-01-18: Story created during planning phase
- 2026-01-18: Approved. Design decisions finalized: context['hook'] structure, experiment provider with model override for LLM queries, logging for skipped roles/early step ends.
