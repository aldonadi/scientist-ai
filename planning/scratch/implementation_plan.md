# Fix Ollama Tool Parameter Passing

## Problem Statement
The `OllamaStrategy.chat()` method receives a `tools` parameter but does NOT pass it to the Ollama API client. This breaks tool calling functionality - the LLM cannot make tool calls because it is unaware of available tools.

## User Review Required

> [!IMPORTANT]
> **All three provider strategies have this bug** - not just Ollama.
> - **Ollama**: `tools` param received but not passed to `client.chat()`
> - **OpenAI**: `tools` param received but not passed to `client.chat.completions.create()`  
> - **Anthropic**: `tools` param received but not passed to `client.messages.create()`
>
> **Recommendation**: Fix all three in this story since they share the same bug pattern.

---

## Proposed Changes

### Provider Strategies

#### [MODIFY] [ollama-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/ollama-strategy.js)

**Current** (lines 37-42):
```javascript
const stream = await client.chat({
    model: modelName,
    messages: history,
    stream: true,
    options: config,
});
```

**Proposed** - Add `tools` parameter and transform to Ollama format:
```javascript
// Transform tools to Ollama format if provided
const ollamaTools = tools && tools.length > 0 ? tools.map(t => ({
    type: 'function',
    function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
    }
})) : undefined;

const stream = await client.chat({
    model: modelName,
    messages: history,
    stream: true,
    options: config,
    tools: ollamaTools,  // ADD THIS
});
```

---

#### [MODIFY] [openai-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/openai-strategy.js)

**Current** (lines 33-38):
```javascript
const stream = await client.chat.completions.create({
    model: modelName,
    messages: history,
    stream: true,
    ...config
});
```

**Proposed** - Add `tools` parameter and fix response parsing:
```javascript
// Transform tools to OpenAI format if provided
const openaiTools = tools && tools.length > 0 ? tools.map(t => ({
    type: 'function',
    function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
    }
})) : undefined;

const stream = await client.chat.completions.create({
    model: modelName,
    messages: history,
    stream: true,
    tools: openaiTools,  // ADD THIS
    ...config
});
```

Also fix response parsing to yield tool_call events (currently only yields text).

---

#### [MODIFY] [anthropic-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/anthropic-strategy.js)

**Current** (lines 60-67):
```javascript
const stream = await client.messages.create({
    model: modelName,
    messages: messages,
    system: systemMessage ? systemMessage.content : undefined,
    stream: true,
    max_tokens: config.max_tokens || 4096,
    ...config
});
```

**Proposed** - Add `tools` parameter (Anthropic format):
```javascript
// Transform tools to Anthropic format if provided
const anthropicTools = tools && tools.length > 0 ? tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters  // Anthropic uses input_schema, not parameters
})) : undefined;

const stream = await client.messages.create({
    model: modelName,
    messages: messages,
    system: systemMessage ? systemMessage.content : undefined,
    stream: true,
    max_tokens: config.max_tokens || 4096,
    tools: anthropicTools,  // ADD THIS
    ...config
});
```

Also fix response parsing to yield tool_call events.

---

### Unit Tests

#### [MODIFY] [provider.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/services/provider/provider.service.test.js)

Add new test cases for each strategy:
- Verify `client.chat()` is called with `tools` parameter when tools provided
- Verify `tools` is omitted when empty array passed
- Verify tool_call events are yielded from stream parsing

---

## Verification Plan

### Automated Tests

**Command**: `npm test -- --testPathPattern=provider.service.test`

**New test cases to add**:
1. `OllamaStrategy.chat() passes tools to client when provided`
2. `OllamaStrategy.chat() omits tools when empty array`
3. `OpenAIStrategy.chat() passes tools to client when provided`
4. `AnthropicStrategy.chat() passes tools to client when provided`

### Manual Verification

Since this affects live LLM calls, full integration testing requires a running Ollama instance:

1. Start Ollama locally: `ollama serve`
2. Ensure a model with tool support is available: `ollama pull llama3.2`
3. Run integration test (if exists) or verify via experiment execution

> [!NOTE]
> Full end-to-end verification may need to wait for Story 051 (Container Interface) since tool execution is currently broken due to container interface mismatch.
