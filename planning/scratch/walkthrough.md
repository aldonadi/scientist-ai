# Walkthrough - Implement Experiment Model Schema

I have implemented the mongoose schema for the `Experiment` model.

## Changes

### 1. Created [experiment.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/experiment.model.js)

The schema includes:
- `planId`: Reference to `ExperimentPlan` (Required, Indexed).
- `status`: Enum string ['INITIALIZING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'] (Required, Indexed).
- `currentStep`: Number, tracks progress.
- `currentEnvironment`: Embedded `environmentSchema`.
- `startTime`: Date (Defaults to now).
- `endTime`: Date.
- `result`: String.

### 2. Created [experiment.model.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/experiment.model.test.js)

Tests cover:
- Successful validation of a correct object.
- Validation failure when required fields (`planId`, `status`) are missing.
- Validation failure when `status` is not in the allowed enum.
- Default value checking for `startTime` and `currentStep`.

## Verification Results

### Automated Tests
Ran `npm test tests/models/experiment.model.test.js`

```
PASS  tests/models/experiment.model.test.js
  Experiment Model Test
    ✓ should create & save experiment successfully (15 ms)
    ✓ should fail schema validation without required fields (3 ms)
    ✓ should fail schema validation with invalid status enum (2 ms)
    ✓ should default startTime to now (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```
