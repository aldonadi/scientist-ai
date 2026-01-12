# Fix Ollama Tool Parameter Passing

- **Status:** DONE
- **Points:** 2
- **Story ID:** 050
- **Type:** Bug

## Description
The `OllamaStrategy.chat()` method receives a `tools` parameter but does NOT pass it to the Ollama API client. This breaks the core agent loop - the LLM cannot make tool calls because it is never informed of available tools.

**Current Code** (`ollama-strategy.js` lines 37-42):
```javascript
const stream = await client.chat({
    model: modelName,
    messages: history,
    stream: true,
    options: config,
    // tools: tools  <-- MISSING!
});
```

### Review Finding Reference
- **Source**: Third-Party Review 1 (C5), Third-Party Review 2 (Section 3) 
- **Severity**: BLOCKER
- **Impact**: LLM cannot perform function calling; agent loop is broken

## User Story
**As a** System,
**I want** the LLM to receive tool definitions,
**So that** agents can use tools during experiment execution.

## Acceptance Criteria
- [x] `OllamaStrategy.chat()` passes `tools` parameter to Ollama client
- [x] Tool call responses are correctly parsed from Ollama stream
- [x] Integration test verifies tool calling works end-to-end
- [x] Other provider strategies (if any) are audited for same issue

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/ollama-strategy.test.js`
- **Cases**:
    - Verify `client.chat()` is called with `tools` parameter
    - Verify tool_call events are parsed correctly

### Integration Tests
- **File**: `backend/tests/integration/tool-calling.test.js`
- **Cases**:
    - Send prompt with tools, verify LLM can invoke a tool
    - Verify tool result is returned in stream

## Technical Notes
- Added `tools: ollamaTools` to the `client.chat()` payload (line 53) with transformation to Ollama format
- Also fixed OpenAI and Anthropic strategies which had the same bug
- Each strategy transforms internal tool format to provider-specific format:
  - Ollama/OpenAI: `{ type: 'function', function: { name, description, parameters } }`
  - Anthropic: `{ name, description, input_schema }`

## Review
**1/11/26** - Accepted by Product Owner. Scope expanded to fix all three providers.
