# Implementation Plan - ModelConfig Schema

Define the Mongoose schema for `ModelConfig` which will be embedded into the `Role` schema.

## User Review Required

> [!NOTE]
> This schema is intended to be embedded, so it will export a `Schema` instance rather than a `Model`.

## Proposed Changes

### Backend

#### [NEW] [modelConfig.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/modelConfig.schema.js)
- Define `ModelConfigSchema` with fields:
    - `provider`: ObjectId (ref: 'Provider', required)
    - `modelName`: String (required)
    - `config`: Mixed (default: {})
- Implement `isValid()` method (stubbed or logic if possible without full provider instance). *Note: The spec mentions `isValid()` checks if provider can be reached. This might belong strictly in the service layer or instance method if we load the provider. For the schema method, we can validation basic structure.*
- Implement `chat()` method stub (to be fully implemented when connected to Service/Provider). *Actually, the spec says Logical Methods (Service Layer). I will define them as instance methods on the schema, but they will likely need dependencies injected or use the `Provider` model.*

## Verification Plan

### Automated Tests
Run the new test file using `jest`.

```bash
npm test backend/tests/models/schemas/modelConfig.schema.test.js
```

### Manual Verification
None required for this backend schema task.
