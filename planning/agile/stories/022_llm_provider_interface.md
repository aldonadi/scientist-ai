# Implement LLM Provider Interface

- **Status:** NOT READY
- **Points:** 3
- **Story ID:** 022
- **Type:** Feature

## Description
Implement the service layer methods for `Provider` that enable communication with LLM backends. This story focuses on the actual provider communication logic, building on the `Provider` schema (story 038) and secret storage (story 044).

The Provider methods allow the application to validate provider connectivity, check model availability, list available models, and initiate chat completions with streaming support.

## Technical Specification

### Service Location
Create `backend/src/services/provider/provider.service.js`

### Method Implementations

#### `isValid(provider)`
- **Purpose**: Test if a connection to the configured provider can be established.
- **Implementation**: Make a lightweight API call (e.g., list models endpoint) to verify connectivity.
- **Returns**: `Promise<boolean>` - `true` if connection succeeds.
- **Error Handling**: Catch network errors, auth errors, and return `false` with logged warning.

#### `isModelReady(provider, modelName)`
- **Purpose**: Check if a specific model is available and ready for inference.
- **Implementation**: Call `listModels()` and check if `modelName` is in the result.
- **Returns**: `Promise<boolean>` - `true` if model is available.

#### `listModels(provider)`
- **Purpose**: Retrieve list of available models from the provider.
- **Implementation**: Depends on provider type:
  - `OLLAMA`: `GET {baseUrl}/api/tags`
  - `OPENAI`: `GET {baseUrl}/v1/models`
  - `ANTHROPIC`: Static list (Anthropic doesn't have list endpoint)
  - `GENERIC_OPENAI`: `GET {baseUrl}/v1/models`
- **Returns**: `Promise<string[]>` - Array of model name strings.

#### `chat(provider, modelName, history, tools, config)`
- **Purpose**: Initiate a chat completion request.
- **Parameters**:
  - `provider`: Provider document with connection details.
  - `modelName`: String identifying the model.
  - `history`: Array of `{role: string, content: string}` messages.
  - `tools`: Array of tool definitions (optional).
  - `config`: Provider/model-specific config (temperature, top_p, etc.).
- **Returns**: Async iterator/stream of response chunks.
- **Implementation**: Use appropriate SDK or HTTP calls based on provider type.

### Provider Type Handling
Use strategy pattern to handle different provider types:
```javascript
const providerStrategies = {
  OLLAMA: new OllamaStrategy(),
  OPENAI: new OpenAIStrategy(),
  ANTHROPIC: new AnthropicStrategy(),
  GENERIC_OPENAI: new GenericOpenAIStrategy()
};
```

### API Key Retrieval
Use `ISecretStore` (from story 044) to retrieve API keys:
```javascript
const secretStore = SecretStoreFactory.getStore();
const apiKey = await secretStore.retrieve(provider.apiKeyRef);
```

## User Story
**As a** Developer,
**I want** to swap LLM providers without code changes,
**So that** I'm not locked into one vendor.

## Acceptance Criteria
- [x] `isValid()` method implemented for all provider types.
- [x] `isModelReady()` method verifies model availability.
- [x] `listModels()` returns array of available model names.
- [x] `chat()` initiates streaming chat completion.
- [x] Provider type strategies implemented (OLLAMA, OPENAI, ANTHROPIC, GENERIC_OPENAI).
- [x] API keys retrieved via `ISecretStore` interface.
- [x] Proper error handling with meaningful error messages.

## Dependencies
- Story 038: Provider Schema (must be complete).
- Story 044: Secret Storage Interface (must be complete).
- Story 023: Ollama Integration (can be developed in parallel).

## Testing
1. **Unit Tests**: Create `backend/tests/services/provider/provider.service.test.js`.
2. **Mock Provider**: Test each method with mocked HTTP responses.
3. **isValid()**: Test success and failure scenarios for each provider type.
4. **listModels()**: Verify correct parsing of model lists per provider type.
5. **Error Handling**: Verify graceful handling of network errors, auth errors.

## Review Log

