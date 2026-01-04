# Provider Schema

- **Status:** READY
- **Points:** 2
- **Story ID:** 038
- **Type:** Feature

## Description
Define the Mongoose schema for the `Provider` object. A Provider represents an interface between this application and an LLM backend driver (e.g., Ollama, OpenAI, Anthropic). Providers are stored as a top-level collection since they can be reused across multiple experiments and model configurations.

## Technical Specification

### MongoDB Collection
**Collection Name**: `Providers`

### Schema Definition
```javascript
{
  _id: ObjectId,
  name: String,        // e.g., "Ollama Local", "OpenAI"
  type: String,        // Enum: OLLAMA, OPENAI, ANTHROPIC, GENERIC_OPENAI
  baseUrl: String,     // URL to the API endpoint
  apiKeyRef: String,   // Reference key to retrieve API key from ISecretStore
  createdAt: Date,
  updatedAt: Date
}
```

### Validated Fields
- **name**: `String` (Required). Human-readable name for the provider. Must be unique.
- **type**: `String` (Required, Enum). Must be one of: `OLLAMA`, `OPENAI`, `ANTHROPIC`, `GENERIC_OPENAI`.
- **baseUrl**: `String` (Required). The API endpoint URL.
- **apiKeyRef**: `String` (Optional). Reference key for retrieving the API key from secret storage (see story 044).

### Schema Options
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

### Indexes
- **Unique Index**: `{ name: 1 }` - Provider names must be globally unique.

> [!NOTE]
> Unlike `Tool` which uses a compound index on `namespace` + `name`, Providers are globally unique by name only. This is because providers represent backend connections (e.g., "Ollama Local", "OpenAI Production") and there is no namespacing concept for provider configurations.

### Methods
The following methods are defined in SPEC.md but are **stubbed** in this story. Full implementation is covered in **Story 022 (LLM Provider Interface)**:
- `isValid()`: Returns `true` if a connection to this Provider can be established.
- `isModelReady(modelName)`: Returns `true` if the provider reports the model is available.
- `listModels()`: Returns a list of available model names.
- `chat(modelName, history, tools, config)`: Initiates a chat completion request.

### Secret Storage Integration
The `apiKeyRef` field stores a reference key (not the actual secret). To retrieve the actual API key:
```javascript
const secretStore = SecretStoreFactory.getStore();
const apiKey = await secretStore.retrieve(provider.apiKeyRef);
```
This decoupling allows swapping secret storage backends (plaintext dev, encrypted prod, Vault, etc.) without changing the Provider schema.

## User Story
**As a** Developer,
**I want** a Mongoose model for LLM Providers,
**So that** I can configure and persist connections to different AI backends.

## Acceptance Criteria
- [ ] Mongoose Schema created in `backend/src/models/provider.model.js`.
- [ ] `name` field is defined as String and Required.
- [ ] `type` field is defined as String with enum validation for: `OLLAMA`, `OPENAI`, `ANTHROPIC`, `GENERIC_OPENAI`.
- [ ] `baseUrl` field is defined as String and Required.
- [ ] `apiKeyRef` field is defined as String (optional).
- [ ] Timestamps are enabled.
- [ ] Unique index on `name` field.
- [ ] Model is exported correctly.
- [ ] Zod validation schema created alongside Mongoose schema (following existing patterns).

## Dependencies
- **Story 044**: Secret Storage Interface (should be implemented first for full integration, but schema can be created independently).

## Testing
1. **Unit Test**: Create test file `backend/tests/models/provider.model.test.js`.
2. **Success Case**: Save a provider with all required fields.
3. **Validation Error**: Save provider without `name` or `baseUrl`, verify failure.
4. **Enum Validation**: Save provider with invalid `type` value, verify failure.
5. **Duplicate Name**: Insert two providers with same name, verify duplicate key error.
6. **Optional apiKeyRef**: Save provider without `apiKeyRef`, verify success.

## Review Log

