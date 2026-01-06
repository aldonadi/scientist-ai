# Walkthrough - Implement Update Plan API

I have successfully implemented the `PUT /api/plans/:id` endpoint for updating experiment plans.

## Changes

### 1. Controller (`plan.controller.js`)
Added `updatePlan` function that:
- Validates the ID format.
- Validates that referenced Providers and Tools exist (using shared `validateReferences` logic).
- Updates the plan in MongoDB using `findByIdAndUpdate`.
- Handles unique name constraint violations.

### 2. Routes (`plan.routes.js`)
Registered the new endpoint:
```javascript
router.put('/:id', planController.updatePlan);
```

### 3. Tests (`plan.routes.test.js`)
Added comprehensive integration tests for:
- **Success:** Updating name, description, roles, and maxSteps.
- **Reference Validation:** Ensuring updated roles point to valid Providers and Tools.
- **Unique Name:** Verifying strict uniqueness for plan names.
- **Error Handling:** 404 for missing plans, 400 for invalid IDs.

## Verification Results

### Automated Tests
Ran `npm test backend/tests/api/plan.routes.test.js`. All 16 tests passed.

```bash
PASS  tests/api/plan.routes.test.js
...
  PUT /api/plans/:id
    ✓ should successfully update a plan (36 ms)
    ✓ should update roles and validate references (38 ms)
    ✓ should fail when provider ID does not exist in update (20 ms)
    ✓ should fail with duplicate plan name (27 ms)
    ✓ should return 404 if plan does not exist (19 ms)
    ✓ should return 400 if ID is invalid (14 ms)
```

## Next Steps
The story `014_api_update_plan` is now marked as `DONE` in the backlog.
