# Implementation Plan - Tool Model Schema

## Goal Description
Implement the **Tool** Mongoose model to store agent capabilities (Python scripts and their parameter definitions). This model is foundational for the `scientist-ai` execution engine, allowing tools to be persisted, retrieved, and validated.

## User Review Required
> [!NOTE]
> The `parameters` field uses `Schema.Types.Mixed` to store JSON Schema objects. While flexible, changes to the validation logic of this field might be needed in the future as we strictly enforce JSON Schema format.

## Proposed Changes

### Backend

#### [NEW] [tool.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/tool.model.js)
- Define Mongoose Schema with:
    - `namespace`: String, Required
    - `name`: String, Required
    - `description`: String
    - `parameters`: Mixed (Object)
    - `code`: String
- Enable Timestamps.
- Add Compound Unique Index on `namespace` and `name`.

### Testing

#### [NEW] [tool.model.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/tool.model.test.js)
- **Unit Test Strategy**: Use `jest` with `mongodb-memory-server` (if available, or standard mocking if strictly unit testing without DB access, but the story implies usage of an in-memory instance or similar mechanism). Use `mongoose` to validate schema constraints.
- Test Cases:
    1.  **Success**: Save a valid tool.
    2.  **Validation Error**: Fail when required fields (`name`, `namespace`) are missing.
    3.  **Duplicate Error**: Fail when saving a duplicate `{namespace, name}` pair.
    4.  **Different Namespace**: Succeed when same `name` is used in different `namespace`.

## Verification Plan

### Automated Tests
Run the newly created test file:
```bash
npm test backend/tests/models/tool.model.test.js
```
(Or ensure it runs via the project's standard test script).
