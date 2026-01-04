# ModelConfig Schema

- **Status:** NOT READY
- **Points:** 2
- **Story ID:** 039
- **Type:** Feature

## Description
Define the schema structure for the `ModelConfig` object. A ModelConfig specifies a model, its provider, and configuration options. This is embedded within `Role` objects rather than stored as a separate collection.

## Technical Specification

### Schema Structure (Embedded Subdocument)
```javascript
{
  provider: ObjectId,    // Reference to Provider collection
  modelName: String,     // Model identifier passed to provider
  config: Object         // Provider/model-specific config (temperature, top_p, etc.)
}
```

### Field Definitions
- **provider**: `ObjectId` (Required). Reference to the `Providers` collection.
- **modelName**: `String` (Required). The model name/identifier used with the provider (e.g., "llama3", "gpt-4").
- **config**: `Object` (Schema.Types.Mixed). Provider and model-specific configuration passed as-is to the provider.

### Example Config Object
```javascript
{
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2048
}
```

### Logical Methods (Service Layer)
- `isValid()`: Returns `true` if the provider can be reached and the modelName is valid.
- `chat(history, tools)`: Wrapper around `provider.chat`.

## User Story
**As a** Developer,
**I want** a schema for ModelConfig objects,
**So that** I can configure which model and settings each Role uses for inference.

## Acceptance Criteria
- [ ] ModelConfig subdocument schema defined in `backend/src/models/schemas/modelConfig.schema.js`.
- [ ] `provider` field is defined as ObjectId reference to `Provider`.
- [ ] `modelName` field is defined as String and Required.
- [ ] `config` field is defined as Mixed type for flexible configuration.
- [ ] Schema is exported for embedding in `Role` schema.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/schemas/modelConfig.schema.test.js`.
2. **Valid Config**: Create ModelConfig with valid provider reference and modelName.
3. **Missing ModelName**: Verify validation error when modelName is missing.
4. **Flexible Config**: Test that various config shapes (nested objects, arrays) can be stored.

## Review Log

