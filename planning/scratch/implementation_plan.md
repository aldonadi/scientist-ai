# Implementation Plan - Get Plan Details API

## Goal Description
Implement the `GET /api/plans/:id` endpoint to retrieve a single experiment plan by its ID. This endpoint should return the full plan document with `roles.tools` populated.

## Proposed Changes

### Backend

#### [MODIFY] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Add `getPlan` function.
- Use `ExperimentPlan.findById(req.params.id)`
- populate `roles.tools`.
- Handle 404 (not found) and 400 (invalid ID).

#### [MODIFY] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Import `getPlan`.
- Add `router.get('/:id', planController.getPlan)`.

## Verification Plan

### Automated Tests
- Run `npm test backend/src/routes/plan.routes.test.js`
- Verify the following scenarios:
    - Success (200) with populated tools.
    - Not Found (404) for valid but non-existent ID.
    - Bad Request (400) for invalid ID format.
