# Implementation Plan - Role Prompt Construction (Story 026)

## Goal Description
Implement the logic within `ExperimentOrchestrator.processRole` to construct the context window definition for an agent role. This involves isolating the environment (deep copy + whitelist), resolving tool definitions, constructing standard System/User messages, and emitting the `MODEL_PROMPT` event.

## User Review Required
> [!IMPORTANT]
> The current story (026) scope effectively ends at emitting `MODEL_PROMPT`. The actual LLM inference and response handling is likely covered in subsequent stories or implicit. I will implement the preparation logic.

## Proposed Changes

### Backend

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Import `Tool` model.
- Import `deepCopy` and `set` from `environment.schema.js`.
- Implement `processRole` method:
    - **Environment Isolation**:
        - Call `deepCopy(this.experiment.currentEnvironment)`.
        - Filter variables against `role.variableWhitelist`.
    - **Tool Resolution**:
        - Query `Tool` model for IDs in `role.tools`.
        - Map to format expected by Provider (or just raw definitions for now).
    - **Prompt Construction**:
        - `systemMessage`: `role.systemPrompt`.
        - `userMessage`: `Step ${stepNumber}. Current Environment: ${JSON.stringify(filteredEnv)}`.
    - **Event Emission**:
        - Emit `EventTypes.MODEL_PROMPT` with `{ experimentId, roleName, messages, tools }`.

## Verification Plan

### Automated Tests
- Create a new unit test or extend existing `experiment-orchestrator.test.js`.
- **Test Case 1: Environment Isolation**
    - Setup: Experiment with env `{ a: 1, b: 2 }`, Role whitelist `['a']`.
    - Action: Run `processRole`.
    - Assert: `MODEL_PROMPT` event payload contains environment with only `a`.
- **Test Case 2: Tool Resolution**
    - Setup: Role with 1 Tool.
    - Assert: `MODEL_PROMPT` event payload contains the tool definition.
- **Test Case 3: Prompt Structure**
    - Assert: Messages array contains correct System and User messages.

### Manual Verification
- N/A (Backend logic, unit tests are sufficient and preferred).
