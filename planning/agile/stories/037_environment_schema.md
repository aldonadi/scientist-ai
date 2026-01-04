# Environment Schema

- **Status:** REVIEW
- **Points:** 2
- **Story ID:** 037
- **Type:** Feature

## Description
Define the schema structure for the `Environment` object. The Environment holds the state of an experiment step, including variables and their type definitions. This will be used as an embedded subdocument within `ExperimentPlan` (as `initialEnvironment`) and `Experiment` (as `currentEnvironment`).

## Technical Specification

### Schema Structure (Embedded Subdocument)
The Environment is embedded, not a standalone collection.

```javascript
{
  variables: Object,       // Map<String, Any> - The actual values
  variableTypes: Object    // Map<String, String> - Type definitions
}
```

### Field Definitions
- **variables**: `Object` (Schema.Types.Mixed). Key-value pairs holding the state values. Keys are variable names, values can be any JSON-serializable type.
- **variableTypes**: `Object` (Schema.Types.Mixed). Key-value pairs defining the type of each variable. Keys are variable names, values are type strings: `string`, `int`, `float`, `bool`, `enum:[A,B,C]`.

### Logical Methods (to be implemented as utility functions or instance methods)
- `deepCopy()`: Returns a new Environment instance with detached state.
- `toJSON()`: Serializes state for storage or API transmission.
- `get(key)`: Retrieves a variable value.
- `set(key, value)`: Modifies a variable (enforces type safety based on `variableTypes`).

## User Story
**As a** Developer,
**I want** a well-defined schema for Environment objects,
**So that** I can store and validate experiment state with proper type enforcement.

## Acceptance Criteria
- [x] Environment subdocument schema is defined in `backend/src/models/schemas/environment.schema.js`.
- [x] `variables` field is defined as `Schema.Types.Mixed`.
- [x] `variableTypes` field is defined as `Schema.Types.Mixed`.
- [x] Schema is exported for embedding in `ExperimentPlan` and `Experiment` models.
- [x] Utility functions for `deepCopy()`, `get()`, `set()` are implemented.
- [x] Type validation logic is implemented for `set()` method.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/schemas/environment.schema.test.js`.
2. **Deep Copy**: Verify `deepCopy()` creates an independent copy (mutations don't affect original).
3. **Type Enforcement**: Test `set()` with correct and incorrect types, verify validation.
4. **Serialization**: Test `toJSON()` produces valid JSON.

## Review Log

