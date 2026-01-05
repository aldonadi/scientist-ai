# Script Schema

- **Status:** DONE
- **Points:** 2
- **Story ID:** 042
- **Type:** Feature

## Description
Define the schema structure for the `Script` object. Scripts are event hooks that execute Python code when specific experiment lifecycle events occur. Scripts are embedded within `ExperimentPlan`.

## Technical Specification

### Schema Structure (Embedded Subdocument)
```javascript
{
  hookType: String,  // Enum mapping to EventTypes
  code: String       // Python code to execute
}
```

### Field Definitions
- **hookType**: `String` (Required, Enum). The event type this script responds to. Valid values:
  - `EXPERIMENT_START`
  - `STEP_START`
  - `ROLE_START`
  - `MODEL_PROMPT`
  - `MODEL_RESPONSE_CHUNK`
  - `MODEL_RESPONSE_COMPLETE`
  - `TOOL_CALL`
  - `TOOL_RESULT`
  - `STEP_END`
  - `EXPERIMENT_END`
  - `LOG`
- **code**: `String` (Required). Python code to execute when the event fires.

### Execution Context
When a Script runs, it receives a context object containing:
- `experiment`: Read-only metadata about the current experiment.
- `environment`: Mutable reference to the Environment (if available in payload).
- `event`: The raw event payload.

### Logical Methods (Service Layer)
- `register(eventBus)`: Subscribes this script's `run` method to the matching event.
- `run(payload)`: Executed when the registered event fires.

## User Story
**As a** Developer,
**I want** a schema for Script hooks,
**So that** I can attach custom logic to experiment lifecycle events.

## Acceptance Criteria
- [x] Script subdocument schema defined in `backend/src/models/schemas/script.schema.js`.
- [x] `hookType` field is defined as String with enum validation for all event types.
- [x] `code` field is defined as String and Required.
- [x] Schema is exported for embedding in `ExperimentPlan`.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/schemas/script.schema.test.js`.
2. **Valid Script**: Create Script with valid hookType and code.
3. **Invalid HookType**: Verify validation error with invalid hookType value.
4. **Missing Code**: Verify validation error when code is missing.

## Review Log
**1/4/2026** - Accepted by Product Owner

