# Implementation Plan - List Plans API

Implement `GET /api/plans` to retrieve a list of experiment plans.

## User Review Required

> [!NOTE]
> The acceptance criteria mentions "maybe minimal fields". I will return a summary object for each plan including: `_id`, `name`, `description`, `createdAt`, `updatedAt`, `roles` (count), `goals` (count).

## Proposed Changes

### Backend

#### [MODIFY] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Add `listPlans` function.
- Fetch all plans from `ExperimentPlan` model.
- Select checks: `_id name description roles goals createdAt updatedAt`.
- Map results to summary format (adding counts for roles and goals).

#### [MODIFY] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Add `GET /` route mapping to `planController.listPlans`.

## Verification Plan

### Automated Tests
Run `npm test backend/tests/api/plan.routes.test.js`

- **[NEW] GET /api/plans**
    - Should return a list of plans.
    - Should support optional pagination (if easy, otherwise just list all as per agile story saying "optional for now"). *Decision: I will implement basic retrieval first. If time permits, simple limit/skip.*
    - Should return 200 OK.
    - Validate response structure (summary fields).
