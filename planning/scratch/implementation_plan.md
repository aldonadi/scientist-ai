# Implement Create Plan API (Story 011)

## Goal
Implement the `POST /api/plans` endpoint to allow users to save Experiment Plans, ensuring data integrity by validating referenced `Provider` and `Tool` IDs.

## User Review Required
> [!IMPORTANT]
> This implementation assumes that `Provider` and `Tool` IDs passed in the plan MUST exist in the database. If they don't, the plan creation will fail with a 400 error.

## Proposed Changes

### Backend

#### [NEW] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Implement `createPlan` function.
- **Validation Logic**:
    - Iterate through `roles`.
    - Check if `role.modelConfig.provider` exists in `Providers` collection.
    - Check if all `role.tools` IDs exist in `Tools` collection.
    - If valid, save `ExperimentPlan`.
    - Handle `duplicate key` error for `name` field.

#### [NEW] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Define `POST /` route pointing to `planController.createPlan`.

#### [MODIFY] [app.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)
- Import `planRoutes`.
- Mount at `/api/plans`.

## Verification Plan

### Automated Tests
I will create a new test file: `backend/tests/api/plan.routes.test.js`.

**Test Scenarios:**
1.  **Happy Path**: Create a valid plan with existing Provider and Tools. Verify 201 status and DB persistence.
2.  **Duplicate Name**: Try to create a plan with a name that already exists. Verify 400/409 status.
3.  **Invalid Provider**: Try to create a plan with a non-existent Provider ID. Verify 400 status and specific error message.
4.  **Invalid Tool**: Try to create a plan with a non-existent Tool ID. Verify 400 status and specific error message.
5.  **Schema Validation**: Try to create a plan with missing required fields (e.g., `name`, `maxSteps`). Verify 400 status.

**Command to Run Tests:**
```bash
npm test backend/tests/api/plan.routes.test.js
```
