# Implementation Plan - LLM Provider Interface

Implement the service layer methods for `Provider` that enable communication with LLM backends (Ollama, OpenAI, Anthropic).

## User Review Required

> [!NOTE]
> This implementation will introduce new dependencies for external API communication if they are not already present (e.g., `axios`, `openai`, `anthropic`). I will assume standard HTTP calls or official SDKs where appropriate. For this plan I will use `axios` for Ollama and standard SDKs for OpenAI/Anthropic if permitted, or just `axios` for all to keep it lightweight as per the story description "Use appropriate SDK or HTTP calls".

## Proposed Changes

### Backend

#### [NEW] [provider.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/provider.service.js)
- Implement `ProviderService` class with methods:
    - `isValid(provider)`
    - `isModelReady(provider, modelName)`
    - `listModels(provider)`
    - `chat(provider, modelName, history, tools, config)`
- Implement Strategy definitions:
    - `OllamaStrategy`
    - `OpenAIStrategy`
    - `AnthropicStrategy`
    - `GenericOpenAIStrategy`
- Use `SecretStoreFactory` to retrieve API keys.

#### [NEW] [provider.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/services/provider/provider.service.test.js)
- Unit tests for `ProviderService`.
- Mock strategies and network calls.

## Verification Plan

### Automated Tests
- Run the new unit tests using Jest:
  ```bash
  npm test backend/tests/services/provider/provider.service.test.js
  ```
