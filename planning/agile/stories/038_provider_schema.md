# Provider Schema

- **Status:** NOT READY
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
  apiKey: String,      // Reference to Secret Manager or Encrypted Storage
  createdAt: Date,
  updatedAt: Date
}
```

### Validated Fields
- **name**: `String` (Required). Human-readable name for the provider.
- **type**: `String` (Required, Enum). Must be one of: `OLLAMA`, `OPENAI`, `ANTHROPIC`, `GENERIC_OPENAI`.
- **baseUrl**: `String` (Required). The API endpoint URL.
- **apiKey**: `String`. Encrypted or reference to secret storage.

### Schema Options
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

### Indexes
- **Unique Index**: `{ name: 1 }` - Provider names must be unique.

### Methods (Service Layer)
- `isValid()`: Returns `true` if a connection to this Provider can be established.
- `isModelReady(modelName)`: Returns `true` if the provider reports the model is available.
- `listModels()`: Returns a list of available model names.
- `chat(modelName, history, tools, config)`: Initiates a chat completion request.

## User Story
**As a** Developer,
**I want** a Mongoose model for LLM Providers,
**So that** I can configure and persist connections to different AI backends.

## Acceptance Criteria
- [ ] Mongoose Schema created in `backend/src/models/provider.model.js`.
- [ ] `name` field is defined as String and Required.
- [ ] `type` field is defined as String with enum validation.
- [ ] `baseUrl` field is defined as String and Required.
- [ ] `apiKey` field is defined as String.
- [ ] Timestamps are enabled.
- [ ] Unique index on `name` field.
- [ ] Model is exported correctly.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/provider.model.test.js`.
2. **Success Case**: Save a provider with all required fields.
3. **Validation Error**: Save provider without `name` or `baseUrl`, verify failure.
4. **Enum Validation**: Save provider with invalid `type` value, verify failure.
5. **Duplicate Name**: Insert two providers with same name, verify duplicate key error.

## Review Log

