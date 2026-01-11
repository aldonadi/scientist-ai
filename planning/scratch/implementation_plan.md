# Implementation Plan - Tool Execution Logic (Story 027)

## Goal Description
Implement the logic to handle `TOOL_CALL` events within the `ExperimentOrchestrator`. This enables the "Action" part of the agent loop, allowing the model to interact with the environment through safe, sandboxed Docker containers.

## User Review Required
> [!IMPORTANT]
> **Ollama Strategy Update**: The current `OllamaStrategy` only yields text content. I will need to update it to support/yield `tool_calls` if the underlying `ollama-js` library provides them, or implement a parsing mechanism if we are strictly using text-based tool invocation. **Assumption**: I will modify `OllamaStrategy` to yield full message objects or specific events when tool calls are detected, which might be a breaking change for anything expecting only strings (though currently `processRole` just emits `MODEL_PROMPT` and stops, so likely safe).

## Proposed Changes

### Backend

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- Implement the "Inference" section in `processRole` (or `processStep` loop).
- **Logic**:
    1. Instantiate `ProviderService`.
    2. Call `ProviderService.chat(...)`.
    3. Iterate over the stream.
    4. Detect `TOOL_CALL` (either via structured object from provider or parsing).
    5. **If Tool Call Detected**:
        - Emit `TOOL_CALL` event.
        - **Acquire Container**: Call `ContainerPoolManager.getInstance().acquire()`.
        - **Execute**: Call `container.execute(tool.code, env, args)`.
        - **Handle Result**: Parse JSON output, update `currentEnvironment`.
        - **Cleanup**: Call `container.destroy()`.
        - Emit `TOOL_RESULT`.
        - Append tool result to history and continue chat (recursion or loop).

#### [MODIFY] [ollama-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/ollama-strategy.js)
- Update `chat` generator to yield objects `{ type: 'text', content: '...' }` or `{ type: 'tool_call', call: ... }` instead of just strings, OR just pass through the raw chunk structure so the Orchestrator can decide.

#### [NEW] [experiment-orchestrator.tool-execution.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/services/experiment-orchestrator.tool-execution.test.js)
- Create a new test file specifically for testing tool execution flow.
- Mock `ContainerPoolManager`, `ProviderService`, and `Tool` model.

## Verification Plan

### Automated Tests
- **Unit Tests**: Run the newly created test file.
    ```bash
    npm test backend/tests/services/experiment-orchestrator.tool-execution.test.js
    ```
    - Verify detection of tool call.
    - Verify container acquisition and execution.
    - Verify environment update from tool output.
    - Verify event emission (`TOOL_CALL`, `TOOL_RESULT`).
