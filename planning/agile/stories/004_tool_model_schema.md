# Create Tool Mongoose Model

- **Status:** DONE
- **Points:** 1
- **Story ID:** 004
- **Type:** Feature

## Description
Define the Mongoose schema for 'Tools' in the backend. The 'Tool' entity represents an action capability for an agent, consisting of executable Python code and a standard JSON schema definition for its parameters.

This model is critical for ensuring that tools passed to the LLM are well-defined and stored persistently. It requires a specific Mongoose schema definition that strictly adheres to the project specification.

## Technical Specification
The Mongoose Schema must be defined as follows:

### Validated Fields
- **namespace**: `String` (Required). Used to group tools (e.g., 'system', 'user_defined').
- **name**: `String` (Required). Unique identifier within the namespace.
- **description**: `String`. A natural language description of what the tool does (consumed by LLM).
- **parameters**: `Object` (Schema: Mixed/JSON). Must be a valid JSON Schema object defining the arguments the tool accepts.
- **code**: `String`. The actual Python source code that will be executed when the tool is called.

### Schema Options
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

### Indexes
- **Compound Unique Index**: `{ namespace: 1, name: 1 }`. This prevents duplicate tool names within the same namespace.

## User Story
**As a** Developer,
**I want** a robust Mongoose model for 'Tools',
**So that** I can store, retrieve, and unique-validate tool definitions for use in experiments.

## Acceptance Criteria
- [x] Mongoose Schema created in `backend/src/models/tool.model.js` (or appropriate path).
- [x] `namespace` field is defined as String and Required.
- [x] `name` field is defined as String and Required.
- [x] `parameters` field is defined to hold a JSON object.
- [x] `code` field is defined as String.
- [x] Standard Mongoose timestamps (`{ timestamps: true }`) are enabled.
- [x] A compound unique index is applied to `{ namespace: 1, name: 1 }`.
- [x] The model is exported correctly for use in other parts of the application.

## Testing
1. **Unit Test**: Create a test file `backend/tests/models/tool.model.test.js`.
2. **Success Case**: Validate that a tool with all required fields can be saved to an in-memory MongoDB instance.
3. **Validation Error**: Validate that saving a tool without `namespace` or `name` throws a validation error.
4. **Duplicate Error**: Insert a tool `test_tool` in `default`, then try to insert another `test_tool` in `default`. Assert that it fails with a duplicate key error.
5. **Different Namespace**: Insert `test_tool` in `namespace_A`, then `test_tool` in `namespace_B`. Assert that both are saved successfully.

## Review
- Ensure the schema matches the `Tool` object definition in `planning/SPEC.md`.
