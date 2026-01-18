# Implement Plan Duplicate Endpoint

- **Status:** DONE
- **Points:** 2
- **Story ID:** 053
- **Type:** Feature

## Description
Implement the missing `POST /api/plans/:id/duplicate` endpoint per SPEC §5 Line 479. This allows users to clone an existing ExperimentPlan for modification.

### Review Finding Reference
- **Source**: Third-Party Review 1 (H2)
- **Severity**: MEDIUM
- **Impact**: Users cannot easily clone plans

## User Story
**As a** User,
**I want** to duplicate an existing experiment plan,
**So that** I can create variations without manually recreating the entire plan.

## Acceptance Criteria
- [x] `POST /api/plans/:id/duplicate` endpoint implemented:
    - [x] Creates a copy of the plan with a new ID
    - [x] Appends " (Copy)" to the plan name
    - [x] Ensures name uniqueness (adds number if needed)
    - [x] Deep copies all nested objects (roles, goals, scripts)
    - [x] Returns 201 with the new plan
    - [x] Returns 404 if source plan doesn't exist
- [x] Unit tests cover endpoint
- [x] Original plan remains unchanged

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/plan.routes.test.js` (extend)
- **Cases**:
    - Duplicate creates new plan with modified name
    - Duplicate deep copies nested objects
    - Duplicate returns 404 for missing source
    - Original plan is unchanged after duplicate

## Technical Notes
- Add route to `plan.routes.js`
- Add `duplicatePlan` method to `plan.controller.js`
- Use Mongoose `toObject()` and remove `_id` fields before saving
- Handle name collision by trying "Name (Copy)", "Name (Copy 2)", etc.

## Review
**1/11/26** - Accepted by Product Owner.