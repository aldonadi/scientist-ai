# Implementation Plan - Delete Plan API

This plan outlines the implementation of the `DELETE /api/plans/:id` endpoint for deleting Experiment Plans.

## User Review Required

> [!NOTE]
> **Referential Integrity**: I will check if any **Experiments** reference the plan before deletion using the now-implemented `Experiment` model. If any experiments exist, the API will return a 409 Conflict.

## Proposed Changes

### Backend

#### [MODIFY] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Import `Experiment` model.
- Add `exports.deletePlan` function.
- Validate ID format.
- Check for existing experiments linked to this plan (`Experiment.countDocuments({ planId: id })`).
    - If count > 0, return 409 Conflict.
- Attempt to find and delete the plan.
- Return 200 on success, 404 if not found, 400 if invalid ID.

#### [MODIFY] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Add `DELETE /:id` route mapping to `planController.deletePlan`.

## Verification Plan

### Automated Tests
- Run `npm test tests/api/plan.routes.test.js`
- Add new test cases in `tests/api/plan.routes.test.js`:
    - `DELETE /api/plans/:id` with valid, unused ID -> 200.
    - `DELETE /api/plans/:id` with non-existent ID -> 404.
    - `DELETE /api/plans/:id` with invalid ID -> 400.
    - `DELETE` with ID used by an Experiment -> 409 (I will create a dummy experiment in the test setup).

### Manual Verification
- None required if automated tests pass, as this is a backend API change.
