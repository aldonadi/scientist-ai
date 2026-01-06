# Implement Update Plan API

## User Review Required
> [!IMPORTANT]
> This change introduces a `PUT` endpoint for updating Experiment Plans. The update replaces the entire resource or fields provided. Validation logic for References (Providers, Tools) will be reused from the creation flow to ensure integrity.

## Proposed Changes

### Backend

#### [MODIFY] [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- Implement `exports.updatePlan` function.
- Reuse `validateReferences` for validation.
- Handle `findByIdAndUpdate` with `{ new: true, runValidators: true }`.
- Handle unique name constraints and validation errors.

#### [MODIFY] [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)
- Register `PUT /:id` to `planController.updatePlan`.

## Verification Plan

### Automated Tests
Run `npm test backend/tests/api/plan.routes.test.js` to verify:
- **Success:** Update plan name, description, roles, goals, scripts.
- **Reference Validation:** Fail if pointing to non-existent Provider or Tool.
- **Unique Constraint:** Fail if renaming to an existing plan name.
- **Not Found:** Fail if ID does not exist.
- **Invalid ID:** Fail if ID format is wrong.

### Manual Verification
- None required as automated tests cover all cases.
