# Story 050: Fix Tool Parameter Passing - Walkthrough

## Summary
Fixed a critical bug where all three provider strategies (Ollama, OpenAI, Anthropic) received but ignored the `tools` parameter, breaking agent tool-calling functionality.

## Changes Made

### Provider Strategies Fixed

| File | Change |
|------|--------|
| [ollama-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/ollama-strategy.js) | Added `tools` parameter transformation and passing |
| [openai-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/openai-strategy.js) | Added `tools` parameter + fixed response parsing for `tool_call` events |
| [anthropic-strategy.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/strategies/anthropic-strategy.js) | Added `tools` parameter with Anthropic's `input_schema` format + fixed response parsing |

### Tool Format Transformation

Each provider requires a slightly different format:

```javascript
// Ollama & OpenAI
{ type: 'function', function: { name, description, parameters } }

// Anthropic
{ name, description, input_schema }  // Uses input_schema instead of parameters
```

### Unit Tests Added

5 new tests in [provider.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/services/provider/provider.service.test.js):

| Test | Strategy |
|------|----------|
| `should pass tools to client.chat() when provided` | Ollama |
| `should omit tools when empty array provided` | Ollama |
| `should yield tool_call events from stream` | Ollama |
| `should pass tools to client.chat.completions.create()` | OpenAI |
| `should pass tools to client.messages.create() with input_schema format` | Anthropic |

## Verification

```
npm test -- provider.service.test --verbose

PASS  tests/services/provider/provider.service.test.js
  ProviderService
    Ollama Strategy
      ✓ should list models successfully using SDK
      ✓ should pass tools to client.chat() when provided
      ✓ should omit tools when empty array provided
      ✓ should yield tool_call events from stream
    OpenAI Strategy
      ✓ should list models using SDK
      ✓ should pass tools to client.chat.completions.create() when provided
    Anthropic Strategy
      ✓ should return static model list
      ✓ should validate connection using dummy chat
      ✓ should pass tools to client.messages.create() with input_schema format

Tests: 9 passed, 9 total
```

## Story Status

- **Story 050**: ✅ **DONE**
- **Backlog updated**: Story moved to DONE status
