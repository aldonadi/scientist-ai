# Experiment Roles and Tools Configuration

The goal is to enhance the configuration capabilities of Experiment Plans and Tools to support more granular control over Role environment visibility, Tool turn-ending behavior, and Hook context awareness.

## User Review Required

> [!IMPORTANT]
> **Default Tool Behavior Change**: We are changing the *default* behavior of the Orchestrator regarding Tool execution. Previously, the Orchestrator would *always* continue the turn (allow the Role to react) after a tool call. The new default will be that a Tool Call **ends the turn** (Role stops), unless the Tool is explicitly configured with `endsTurn: false`.
> **Please confirm if this interpretation of "The default should be the turn DOES end" logic is correct.** 
> Assumption: "Turn ending" means the current Role finishes its processing for the current Step. 

## Proposed Changes

### Backend

#### [MODIFY] [tool.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/tool.model.js)
- Add `endsTurn` field to `toolSchema`.
  - Type: `Boolean`
  - Default: `true`

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Update `processRole` loop logic.
- Fetch `endsTurn` property from the Tool document.
- Use `endsTurn` to determine if `shouldContinue` should be set to true or false.
  - If `endsTurn` is true, `shouldContinue = false`.
  - If `endsTurn` is false, `shouldContinue = true`.
- Verify `variableWhitelist` logic (no code change expected if existing logic handles `undefined` vs `empty array` correctly, but will triple check).

### Frontend

#### [MODIFY] [roles-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/roles-tab.component.ts)
- Add UI to edit `variableWhitelist` for a Role.
  - Implement as a simple comma-separated text input (e.g. "varA, varB") for MVP simplicity, or a tag input.
  - If empty, it means "All Variables" (or "No Variables"? Need to clarify default). 
  - *Refinement*: Existing backend logic: `if (whitelist && whitelist.length > 0)`. So empty/undefined = All Variables.
  - UI will show "All Variables" if empty.

#### [MODIFY] [tool-editor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/tools/tool-editor.component.ts)
- Add `endsTurn` checkbox.
- Bind to `tool.endsTurn`.

#### [MODIFY] [tool.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/tool.service.ts)
- Update `Tool` interface and `CreateToolDto` to include `endsTurn`.

#### [MODIFY] [plan.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/plan.service.ts)
- Ensure Role interface matches backend (it usually does automatically via JSON, but good to check).

## Verification Plan

### Automated Tests
Create a new test file `backend/src/services/experiment-orchestrator.tool-execution.test.js` to specifically test the interaction loop.

1. **Test Role Environment Isolation**:
   - Mock a Plan with Role having `variableWhitelist: ['A']`.
   - Run `processRole`.
   - Verify the `messages` passed to `EventTypes.MODEL_PROMPT` contain only variable 'A'.

2. **Test Tool Turn Ending**:
   - Mock Tool A with `endsTurn: true`.
   - Mock Tool B with `endsTurn: false`.
   - **Case 1**: Role calls Tool A. Verify loop terminates after 1 iteration.
   - **Case 2**: Role calls Tool B. Verify loop continues (mock provider returning text response in next iteration).

3. **Test Hook Context**:
   - Register a `BEFORE_TOOL_CALL` hook.
   - Run a step that calls a tool.
   - Verify the hook handler receives `event.toolName`.
   - Verify a Python hook script can access `event.toolName`.

### Manual Verification
1. **Frontend**:
   - Create a new Tool "Turn Ender" (endsTurn=true).
   - Create a new Tool "Turn Continuer" (endsTurn=false, e.g. a 'Calculator').
   - Create a Plan with a Role that sees only specific Env Vars.
   - Edit the Plan, verify persistence of `variableWhitelist`.
2. **Execution**:
   - Run the plan.
   - Check Logs: "Step X. Current Environment: ..." -> Verify only whitelisted vars are shown.
   - Check Behavior:
     - When "Turn Continuer" is called, verify the model immediately outputs "I have calculated..." (Turn continued).
     - When "Turn Ender" is called, verify the step ends immediately.
