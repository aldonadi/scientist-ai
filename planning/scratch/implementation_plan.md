# Implementation Plan - ExperimentPlan Schema (Story 043)

This plan details the implementation of the `ExperimentPlan` Mongoose model, which serves as the top-level template for experiments in Scientist.ai.

## User Review Required

> [!NOTE]
> This schema embeds several other schemas (`Environment`, `Role`, `Goal`, `Script`) which have already been implemented. This implementation mainly aggregates them into the parent `ExperimentPlan` document.

## Proposed Changes

### Backend

#### [NEW] [experimentPlan.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/experimentPlan.model.js)

- Define the `ExperimentPlan` schema using Mongoose.
- Embed `environmentSchema`, `RoleSchema`, `GoalSchema`, and `ScriptSchema`.
- Apply validation rules (required fields, defaults).
- Enable timestamps.
- Add unique index on `name`.

### Tests

#### [NEW] [experimentPlan.model.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/experimentPlan.model.test.js)

- Test valid plan creation with all nested components.
- Test minimal plan creation (only required fields).
- Test validation errors (missing required fields, invalid nested data).
- Test duplicate name error.

## Verification Plan

### Automated Tests
Run the newly created unit tests:
```bash
npm test backend/tests/models/experimentPlan.model.test.js
```
