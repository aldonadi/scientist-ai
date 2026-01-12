# Walkthrough: Story 048 - Experiment CRUD API

## Summary
Implemented the missing Experiment API endpoints per SPEC §5.

## Changes Made

### [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)
- Added `listExperiments` - Lists all experiments with optional `?status=` filter, validates against enum
- Added `getExperiment` - Returns full document including `currentEnvironment`, validates ObjectId format
- Added `deleteExperiment` - Deletes ended experiments (COMPLETED/FAILED/STOPPED), also removes associated logs

### [experiment.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/experiment.routes.js)
- Added `GET /`, `GET /:id`, `DELETE /:id` routes

## Test Coverage

22 tests added to [experiment.routes.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/experiment.routes.test.js):

| Endpoint | Tests |
|----------|-------|
| `GET /api/experiments` | Empty array, all experiments, status filter, invalid status (400), includes endTime/result, sorted by startTime |
| `GET /api/experiments/:id` | Full document with environment, 404 missing, 400 invalid ID |
| `DELETE /api/experiments/:id` | 204 for COMPLETED/FAILED/STOPPED, 400 for RUNNING/PAUSED/INITIALIZING, 404 missing, 400 invalid ID, log cleanup |

## Verification

```
Test Suites: 33 passed, 33 total
Tests:       374 passed, 374 total
```

No regressions.
