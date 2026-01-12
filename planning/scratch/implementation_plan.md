# Implementation Plan - Duplicate Experiment Endpoint (Story 053)

## Goal Description
Implement the `POST /api/plans/:id/duplicate` endpoint to allow users to clone an existing Experiment Plan. This will create a deep copy of the plan, including all roles, goals, scripts, and environment settings, with a modified name to avoid uniqueness constraints.

## User Review Required
> [!NOTE]
> Name collision strategy: The system will attempt to append " (Copy)" to the original name. If that exists, it will try " (Copy 2)", " (Copy 3)", etc., up to a limit (e.g., 10 attempts) before failing or relying on the user to provide a unique name.

## Proposed Changes

### Backend Component

#### [MODIFY] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Add `duplicatePlan` method.
    - Logic to find the source plan.
    - Deep copy the data (using `toObject()` and cleanup).
    - Remove system fields (`_id`, `createdAt`, `updatedAt`, `__v`).
    - Implement name uniqueness logic:
        - Check if `Name (Copy)` exists.
        - If so, try `Name (Copy N)` incrementing N.
    - Create and save the new `ExperimentPlan`.

#### [MODIFY] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Register `POST /:id/duplicate` route tied to `planController.duplicatePlan`.

## Verification Plan

### Automated Tests
- **File**: `backend/tests/api/plan.routes.test.js`
- **Command**: `npm test backend/tests/api/plan.routes.test.js`

**Test Cases**:
1.  **Basic Duplication**: Call `/duplicate` on an existing plan. Verify 201 response and that the returned plan has `(Copy)` in the name and a new ID.
2.  **Custom Name**: Call `/duplicate` with `{ name: "My Custom Copy" }`. Verify the new name is used.
3.  **Name Collision**: Create a plan "A". Duplicate it to get "A (Copy)". Duplicate "A" again. Verify we get "A (Copy 2)".
4.  **Deep Copy**: Verify that modifying the nested objects (e.g., `roles[0].systemPrompt`) in the copy does *not* affect the original plan.
5.  **Not Found**: Call `/duplicate` on a non-existent ID. Verify 404.

### Manual Verification
1.  (Optional if automated tests are comprehensive) Use `curl` or Postman to trigger the endpoint against a running server.
    - `POST http://localhost:3000/api/plans/<id>/duplicate`
