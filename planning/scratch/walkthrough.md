# Walkthrough - Implement Delete Plan API

I have implemented the `DELETE /api/plans/:id` endpoint.

## Changes

### 1. Controller Update ([plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js))

Added `deletePlan` method which:
1.  Validates the ID format (returns 400 if invalid).
2.  Checks for Referential Integrity: Queries the `Experiment` collection. If any experiments are using the plan, it returns `409 Conflict`.
3.  Deletes the plan using `findByIdAndDelete`.
4.  Returns 200 if successful, 404 if not found.

### 2. Route Update ([plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js))

Mapped `DELETE /:id` to the new controller method.

### 3. Tests ([plan.routes.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/plan.routes.test.js))

Added a new describe block `DELETE /api/plans/:id` covering:
- Successful deletion (200).
- Conflict when plan is in use (409).
- Plan not found (404).
- Invalid ID format (400).

## Verification Results

### Automated Tests
Ran `npm test tests/api/plan.routes.test.js`

```
PASS  tests/api/plan.routes.test.js
  ...
  DELETE /api/plans/:id
    ✓ should successfully delete an unused plan (30 ms)
    ✓ should return 409 if plan is used by an experiment (31 ms)
    ✓ should return 404 if plan does not exist (23 ms)
    ✓ should return 400 if ID is invalid (19 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```
