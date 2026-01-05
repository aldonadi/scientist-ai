# Walkthrough - Create Plan API (Story 011)

I have implemented the `POST /api/plans` endpoint, enabling users to save Experiment Plans.

## Changes

### Endpoint
- **POST /api/plans**: Accepts a JSON body validating against the `ExperimentPlan` schema.
- **Validation**: Enforces that referenced `Provider` and `Tool` IDs exist in the database before saving.

### Codebase
- **New Controller**: `backend/src/controllers/plan.controller.js`
- **New Routes**: `backend/src/routes/plan.routes.js`
- **App Update**: Registered routes in `backend/src/app.js`

## Verification Results

### Automated Tests
I created comprehensive integration tests in `backend/tests/api/plan.routes.test.js`.

**Test Suite Results:**
```
PASS  backend/tests/api/plan.routes.test.js
  Plan API Integration Tests
    ✓ should create a valid plan (112 ms)
    ✓ should fail when provider ID does not exist (23 ms)
    ✓ should fail when tool ID does not exist (22 ms)
    ✓ should fail with duplicate plan name (56 ms)
    ✓ should fail with missing required fields (17 ms)
```

### Manual Verification Steps
1.  **Valid Plan**:
    - Creation of a plan with a valid `Provider` (OpenAI type) and `Tool`.
    - Response: `201 Created` with full plan object.
2.  **Invalid References**:
    - Sending a plan with a non-existent `Provider` ID returns `400 Bad Request` with message: `"Role[0] '...' : Provider ID '...' not found."`
    - Sending a plan with a non-existent `Tool` ID returns `400 Bad Request`.
3.  **Schema Validation**:
    - Missing required fields returns `400 Bad Request`.
