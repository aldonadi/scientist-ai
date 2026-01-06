# Implementation Plan - Delete Plan API

This plan outlines the implementation of the `DELETE /api/plans/:id` endpoint for deleting Experiment Plans.

## User Review Required

> [!IMPORTANT]
> **Referential Integrity Check Deferred**: The requirement to check if any **Experiments** reference the plan before deletion cannot be fully implemented because the `Experiment` model and schema have not been implemented yet (Story 015 is NOT READY).
> I will implement the deletion logic. The check for existing experiments will be added as a TODO or a placeholder function that always returns false (no experiments found) until the `Experiment` model is available.

## Proposed Changes

### Backend

#### [MODIFY] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Add `exports.deletePlan` function.
- Validate ID format.
- Attempt to find and delete the plan.
- Return 200 on success, 404 if not found, 400 if invalid ID.
- (Deferred) Check for active experiments using this plan.

#### [MODIFY] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Add `DELETE /:id` route mapping to `planController.deletePlan`.

## Verification Plan

### Automated Tests
- Run `npm test tests/api/plan.routes.test.js`
- Add new test cases in `tests/api/plan.routes.test.js`:
    - `DELETE /api/plans/:id` with valid, unused ID -> 200.
    - `DELETE /api/plans/:id` with non-existent ID -> 404.
    - `DELETE /api/plans/:id` with invalid ID -> 400.
    - (Deferred) `DELETE` with ID used by an Experiment -> 409 (This test will be skipped or mocked if possible, but likely skipped for now).

### Manual Verification
- None required if automated tests pass, as this is a backend API change.
