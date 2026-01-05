# Walkthrough - Implement ExperimentPlan Schema (Story 043)

I have implemented the `ExperimentPlan` Mongoose schema, which serves as the top-level template for experiments. It successfully composes the existing `Environment`, `Role`, `Goal`, and `Script` schemas.

## Changes

### Backend

#### [NEW] [experimentPlan.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/experimentPlan.model.js)

- Defined `ExperimentPlan` schema with Mongoose.
- Embedded dependent schemas.
- Added validation for `name`, `maxSteps`, and other fields.
- Enabled timestamps.
- Added unique index for `name`.

### Tests

#### [NEW] [experimentPlan.model.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/experimentPlan.model.test.js)

- Implemented comprehensive unit tests covering:
    - Valid plan creation.
    - Minimal plan creation with defaults.
    - Validation errors (missing fields, duplicate name, invalid nested data).

## Verification Results

### Automated Tests

Ran `npm test tests/models/experimentPlan.model.test.js --prefix backend` and all tests passed.

```
PASS  tests/models/experimentPlan.model.test.js
  ExperimentPlan Model Test
    ✓ should create & save a valid experiment plan (81 ms)
    ✓ should create a minimal plan with only required fields (14 ms)
    ✓ should fail validation without required name field (10 ms)
    ✓ should fail validation with duplicate name (23 ms)
    ✓ should fail validation if nested schemas are invalid (11 ms)
```
