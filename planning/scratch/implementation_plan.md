# Script System Upgrade: Hook Context & Actions API

This plan implements a significant enhancement to the Script system, enabling scripts to receive hook-specific context data and perform actions that affect experiment execution.

## User Review Required

> [!IMPORTANT]
> **Design Decisions Requiring User Input:**
> 
> 1. **Hook Context Design**: Should we expose context via `hook_context` dict or merge it into the existing `context` object? 
>    - Option A: `hook_context.tool_name` (separate namespace, explicit)
>    - Option B: `context.tool_name` or `event.tool_name` (unified, already exists as `event`)
>    - **Recommendation**: Use `hook` as a cleaner alias: `hook.tool_name`, `hook.step_number`
> 
> 2. **LLM Query Provider**: For `actions.query_llm()`, should it:
>    - Use the experiment's configured provider (consistent but ties to experiment config)
>    - Use a dedicated "utility" provider (independent, but more config)
>    - **Recommendation**: Use experiment's provider with option to override model name
>
> 3. **Immediate Step End**: For `actions.end_step(immediate=True)`:
>    - Should remaining scripts in current hook be skipped?
>    - **Recommendation**: Yes, skip remaining scripts (matches "immediate" semantics)

## Proposed Changes

### Backend - Python Wrapper Enhancement

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

**Changes to `executeHook()` method:**
1. Construct `hook` dict with hook-type-specific fields based on `eventPayload`
2. Inject `hook` and `actions` into Python execution namespace
3. Parse returned `_pending_actions` array from script output
4. Process actions after script completes (stop experiment, log, end step, etc.)

**New helper method `_processScriptActions()`:**
- Interpret action objects and apply effects to experiment state
- Handle `STOP_EXPERIMENT`, `LOG`, `END_STEP`, `SKIP_ROLE`, `QUERY_LLM`
- Return control signals to caller (e.g., shouldSkipRole, shouldEndStep)

**Python wrapper changes:**
```python
# Inject 'hook' context dict with hook-specific data
hook = {
    'type': 'BEFORE_TOOL_CALL',
    'tool_name': ...,
    'args': ...
}

# Inject 'actions' helper class
class Actions:
    _pending = []
    
    @staticmethod
    def stop_experiment(success=False, message=None):
        Actions._pending.append({
            'type': 'STOP_EXPERIMENT',
            'success': success,
            'message': message
        })
    
    @staticmethod
    def log(message, data=None):
        Actions._pending.append({
            'type': 'LOG', 
            'message': message,
            'data': data
        })
    # ... etc

actions = Actions()
```

---

#### [MODIFY] [script.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/script.schema.js)

No schema changes required. Existing schema supports new behavior.

---

### Backend - Orchestrator Control Flow

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

**Changes to `processRole()` method:**
- Check for `skipRole` flag after hook execution
- If set, return early from role processing

**Changes to `processStep()` method:**
- Check for `endStep` flag after each role
- If `immediate`, exit step loop immediately
- Otherwise, complete current hook batch then exit

**Changes to `runLoop()` method:**
- Check for `stopExperiment` flag after each step
- Update experiment status and result accordingly

---

### Frontend - Script Editor Quick Reference

#### [MODIFY] [scripts-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts)

Add a collapsible Quick Reference panel showing:
1. Available `hook` fields for the currently selected hook type
2. Available `actions` methods with signatures

**New data structure:**
```typescript
const HOOK_CONTEXT_FIELDS: Record<string, {field: string, type: string, description: string}[]> = {
  'BEFORE_TOOL_CALL': [
    { field: 'tool_name', type: 'string', description: 'Name of the tool about to be called' },
    { field: 'args', type: 'dict', description: 'Arguments passed to the tool' }
  ],
  'STEP_START': [
    { field: 'step_number', type: 'int', description: 'Current step number (0-indexed)' }
  ],
  // ... etc
};

const ACTIONS_REFERENCE = [
  { method: 'actions.stop_experiment(success=False, message=None)', description: 'Stop experiment as SUCCESS or FAILURE' },
  { method: 'actions.log(message, data=None)', description: 'Write entry to experiment log' },
  { method: 'actions.end_step(immediate=False)', description: 'End current step' },
  { method: 'actions.skip_role()', description: 'Skip current role processing' },
  { method: 'actions.query_llm(prompt, system=None, model=None)', description: 'Query LLM and get response (blocking)' },
];
```

**Template changes:**
- Add collapsible reference panel below hook description
- Show fields in a compact table format
- Show actions with method signatures

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js) | MODIFY | Add hook context injection, actions API, control flow handling |
| [scripts-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts) | MODIFY | Add Quick Reference panel for hook context and actions |

---

## Verification Plan

### Automated Tests

Existing test infrastructure in `backend/tests/`:
- `backend/tests/integration/hooks.test.js` - Hook integration tests
- `backend/tests/services/event-bus.test.js` - Event bus tests

**New tests to add:**

1. **Unit Test: Hook Context Injection** (`backend/tests/services/hook-context.test.js`)
   ```bash
   cd backend && npm test -- --testPathPattern=hook-context
   ```
   - Verify each hook type produces correct context fields
   - Verify context is accessible in Python script

2. **Unit Test: Script Actions** (`backend/tests/services/script-actions.test.js`)
   ```bash
   cd backend && npm test -- --testPathPattern=script-actions
   ```
   - Verify each action method produces correct output format
   - Verify actions are collected and returned from script

3. **Integration Test: Actions Processing** (`backend/tests/integration/script-actions.test.js`)
   ```bash
   cd backend && npm test -- --testPathPattern=integration/script-actions
   ```
   - Test `actions.stop_experiment()` terminates experiment with correct status
   - Test `actions.log()` creates log entry in database
   - Test `actions.end_step()` advances to next step
   - Test `actions.skip_role()` skips role processing

### Manual Verification

1. **Quick Reference UI Test**:
   - Open Plan Editor → Scripts tab
   - Select different hooks (STEP_START, BEFORE_TOOL_CALL, etc.)
   - Verify Quick Reference panel updates to show relevant fields
   - Verify actions section shows all available methods

2. **Hook Context End-to-End Test**:
   - Create a plan with script on `BEFORE_TOOL_CALL`:
     ```python
     def run(context):
         actions.log(f"About to call tool: {hook.tool_name}")
     ```
   - Run experiment with a role that has tools
   - Check logs for the "About to call tool: [name]" entry

3. **Stop Experiment Action Test**:
   - Create a plan with script on `STEP_START`:
     ```python
     def run(context):
         if hook.step_number >= 2:
             actions.stop_experiment(success=True, message="Early success!")
     ```
   - Run experiment, verify it stops at step 2 with SUCCESS status
