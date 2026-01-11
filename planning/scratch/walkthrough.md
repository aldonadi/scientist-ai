# Walkthrough - Role Prompt Construction (Story 026)

I have implemented the logic for constructing role prompts within the `ExperimentOrchestrator`. This ensures that each agent role receives a properly isolated environment context and access to its assigned tools.

## Changes

### Backend

#### [custom] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Implemented `processRole(role)` method.
- **Environment Isolation**: Uses `deepCopy` and filters the environment based on `role.variableWhitelist`.
- **Tool Resolution**: Fetches full `Tool` definitions from the database for the provider.
- **Event Emission**: Emits `MODEL_PROMPT` with the constructed messages and resolved tools.

## Verification Results

### Automated Tests
I created a new test suite [role-prompt.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/role-prompt.test.js) and verified that:
- Environment variables are correctly filtered based on the whitelist.
- A deep copy is used to prevent state leakage.
- Tools are correctly resolved and included in the payload.
- System and User messages are constructed with the correct content.

```bash
PASS  tests/role-prompt.test.js
  ExperimentOrchestrator - Role Prompt Construction
    ✓ should construct prompt with filtered environment based on whitelist (9 ms)
    ✓ should provide full environment if whitelist is empty/undefined (1 ms)
    ✓ should resolve tools and include in payload (2 ms)
    ✓ should construct correct system and user messages (2 ms)
```
