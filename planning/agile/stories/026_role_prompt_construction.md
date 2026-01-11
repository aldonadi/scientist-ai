# Implement Role Prompt Construction

- **Status:** READY
- **Points:** 5
- **Story ID:** 026
- **Type:** Feature

## Description
Implement logic to build the context window for a Role in `ExperimentOrchestrator`, ensuring the role receives the correct context and tool definitions.

## User Story
**As a** System,
**I want** to construct accurate prompts,
**So that** the LLM has the necessary context to make decisions.

## Technical Requirements
-   **Environment Isolation**:
    -   Create a **Deep Copy** of `Experiment.currentEnvironment`.
    -   Filter the environment variables based on `Role.variableWhitelist`.
-   **Prompt Construction**:
    -   **System Message**: Combine Role Name and `systemPrompt`.
    -   **User Message**: Include current step number and standard instruction (e.g., "Analyze environment...").
-   **Events**: Emit `MODEL_PROMPT` event *before* sending to provider (allows hooks to inspect/modify).
-   **Tools**: Retrieve `Tool` definitions referenced by the Role and format them for the LLM Provider.

## Acceptance Criteria
- [ ] Creates deep copy of environment to prevent leakage.
- [ ] Filters environment variables correctly based on whitelist.
- [ ] Constructs System and User messages.
- [ ] Emits `MODEL_PROMPT` event with mutable payload.
- [ ] Resolves linked Tools for the Provider.

## Testing
1.  Unit test with dummy environment and key whitelist (verify keys are filtered).
2.  Verify `MODEL_PROMPT` event contains the constructed messages.

## Review Log
