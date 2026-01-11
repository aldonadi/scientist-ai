# Walkthrough - Tool Execution Logic (Story 027)

I have implemented the logic to handle `TOOL_CALL` events within the `ExperimentOrchestrator`, enabling the agent to interact with the environment via safe Docker containers.

## Changes

### 1. `ExperimentOrchestrator` Update
- Implemented the inference loop in `processRole`.
- Added detection of `tool_call` events from the provider.
- Integrated `ContainerPoolManager` to acquire `READY` containers.
- Executed tool code using the acquired container.
- Handled tool results (parsing JSON output, updating `currentEnvironment`).
- Emitted `TOOL_CALL` and `TOOL_RESULT` events.
- Appended tool calls and results to the conversation history to support multi-turn tool usage (up to 5 loops).

### 2. `OllamaStrategy` Update
- Updated the `chat` generator to yield structured objects `{ type: 'text' | 'tool_call', ... }` instead of just raw strings.
- This ensures the orchestrator can reliably distinguish between content and tool invocation.

### 3. New Unit Test
- Created `backend/tests/services/experiment-orchestrator.tool-execution.test.js`.
- Verifies the full flow:
    - Provider simulates text -> tool call.
    - Orchestrator detects call.
    - Container acquired and executed.
    - Result parsed and environment updated.
    - Events emitted correctly.
    - Container destroyed.

## Verification Results

### Automated Tests
Ran the new test suite:
```bash
npm test backend/tests/services/experiment-orchestrator.tool-execution.test.js
```
**Result**: PASS

```
PASS  tests/services/experiment-orchestrator.tool-execution.test.js
  ExperimentOrchestrator Tool Execution
    ✓ should detect and execute a tool call (14 ms)
```
