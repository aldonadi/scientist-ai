# Experiment Roles and Tools Configuration

All requested features have been implemented and verified.

## Changes

### 1. Tool Turn Control
- **Backend**: Added `endsTurn` (boolean) to the Tool schema. Default is `true`.
- **Orchestrator**: Updated execution logic. If a tool with `endsTurn=true` is called, the Role's turn ends after the tool execution. If `endsTurn=false`, the Role continues its thought process/actions.
- **Frontend**: Added "Ends Turn" checkbox to the Tool Editor.

### 2. Role Environment Variable Isolation
- **Backend**: Verified existing `variableWhitelist` logic in Role schema.
- **Orchestrator**: Ensures strict filtering of environment variables based on the whitelist before sending the prompt to the model.
- **Frontend**: Added "Environment Variable Allowlist" input to the Roles configuration tab.

### 3. Hook Context
- **Orchestrator**: Verified that `BEFORE_TOOL_CALL` and `AFTER_TOOL_CALL` events include the `toolName`, allowing hooks to react specifically to the tool being used.

## Verification Results

### Automated Tests
A new test suite `experiment-orchestrator.tool-execution.test.js` was created to verify the core logic.

| Test Case | Result |
|-----------|--------|
| Ends Turn behavior (`endsTurn=true`) | ✅ Passed |
| Continue Turn behavior (`endsTurn=false`) | ✅ Passed |
| Default behavior (undefined `endsTurn`) | ✅ Passed |
| Environment Variable Whitelist filtering | ✅ Passed |
| Hook Context (`toolName` payload) | ✅ Passed |

### Usage Guide
1. **Configure Tool Turn Ending**: Go to Tools -> Edit Tool -> Check/Uncheck "Ends Turn". Check it for terminal actions (e.g. "Final Answer"), uncheck it for intermediate steps (e.g. "Calculator").
2. **Restrict Role Knowledge**: Go to Plans -> Edit Plan -> Roles -> Edit Role. Enter comma-separated variable names in "Environment Variable Allowlist". Leave empty to allow the role to see all variables.
