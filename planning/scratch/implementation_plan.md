# Implementation Plan - Role, Goal, and Script Schemas

Implement Mongoose schemas for `Role`, `Goal`, and `Script` as embedded subdocuments to be used in `ExperimentPlan`.

## User Review Required

> [!NOTE]
> These schemas are primarily definition-only at this stage. Logic methods described in the SPECs (like `constructPrompt` or `evaluate`) will be implemented in the Service layer or as instance methods in later stories, but for now we are focusing on the data structure and validation.

## Proposed Changes

### Backend - Models

#### [NEW] [role.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/role.schema.js)
- Define `RoleSchema` with fields:
    - `name` (String, Required)
    - `modelConfig` (Embedded ModelConfigSchema, Required)
    - `systemPrompt` (String)
    - `tools` (Array of ObjectId refs to `Tool`)
    - `variableWhitelist` (Array of Strings)

#### [NEW] [goal.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/goal.schema.js)
- Define `GoalSchema` with fields:
    - `description` (String, Required)
    - `conditionScript` (String, Required)

#### [NEW] [script.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/script.schema.js)
- Define `ScriptSchema` with fields:
    - `hookType` (String, Required, Enum: ['EXPERIMENT_START', 'STEP_START', ...])
    - `code` (String, Required)

### Backend - Tests

#### [NEW] [role.schema.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/schemas/role.schema.test.js)
- Test valid role creation.
- Test missing required fields.
- Test structure of embedded fields.

#### [NEW] [goal.schema.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/schemas/goal.schema.test.js)
- Test valid goal creation.
- Test missing fields.

#### [NEW] [script.schema.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/schemas/script.schema.test.js)
- Test valid script creation.
- Test invalid hook types (Enum validation).

## Verification Plan

### Automated Tests
Run unit tests for the new schemas:
```bash
npm test backend/tests/models/schemas/role.schema.test.js
npm test backend/tests/models/schemas/goal.schema.test.js
npm test backend/tests/models/schemas/script.schema.test.js
```

### Manual Verification
Review code to ensure Mongoose definitions match `SPEC.md`.
