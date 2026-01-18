# Implement Tool Execution Logic

- **Status:** DONE
- **Points:** 5
- **Story ID:** 027
- **Type:** Feature

## Description
Implement the logic to handle a `TOOL_CALL` event by executing the tool safely using the Container system.

## User Story
**As a** Agent,
**I want** my tool calls to actually do things,
**So that** I can affect the environment.

## Technical Requirements
-   **Detection**: Identify `TOOL_CALL` from LLM response.
-   **Acquisition**: Use `ContainerPoolManager.acquire()` to get a `READY` container.
-   **Execution**:
    -   Locate `Tool` definition by name.
    -   Call `Container.execute(tool.code, currentEnvironment, args)`.
-   **Lifecycle**:
    -   Call `Container.destroy()` immediately after execution (One-Shot policy).
-   **State Update**:
    -   Parse `stdout` (expecting JSON or key-value pairs) and update `Experiment.currentEnvironment`.
    -   Handle `stderr` or non-zero exit codes (logging/error handling).
-   **Events**: Emit `TOOL_CALL` (before) and `TOOL_RESULT` (after).

## Acceptance Criteria
- [x] Logic correctly detects tool call requests.
- [x] Acquires container from `ContainerPoolManager`.
- [x] Executes tool code with correct env/args.
- [x] Destroy container after single use.
- [x] Updates `Variables` map with result.
- [x] Emits `TOOL_CALL` and `TOOL_RESULT` events.

## Testing
1.  Simulate a tool call event.
2.  Mock `ContainerPoolManager` to return a mock Container.
3.  Verify `acquire`, `execute`, and `destroy` sequence.
4.  Verify environment update.

## Review Log
**1/11/26**: Accepted by Product Owner