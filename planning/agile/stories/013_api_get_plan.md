# Implement Get Plan Details API

- **Status:** DONE
- **Points:** 1
- **Story ID:** 013
- **Type:** Feature

## Description
Implement GET /api/plans/:id.

## User Story
**As a** User,
**I want** to load a full plan,
**So that** I can review or edit it.

## Technical Details
- **Endpoint**: `GET /api/plans/:id`
- **Controller Method**: `getPlan`
- **Mongoose Model**: `ExperimentPlan`
- **Population**: The `roles.tools` field must be populated to show tool details (name, namespace, etc.) instead of just ObjectIds.
- **Error Handling**:
    - 404 Not Found if ID does not exist.
    - 400 Bad Request if ID is invalid.
    - 500 Internal Server Error for other failures.

## Acceptance Criteria
- [x] Returns 200 OK with full plan document.
- [x] `roles.tools` are populated with Tool objects.
- [x] Returns 404 if plan not found.
- [x] Returns 400 if ID is invalid.

## Testing
1. **Unit/Integration Tests**:
    - `GET /api/plans/:id` with valid ID -> 200 + Plan Object.
    - `GET /api/plans/:id` with non-existent valid ID -> 404.
    - `GET /api/plans/:id` with invalid mongo ID -> 400.
    - Verify `roles.tools` population.

## Review Log
**1/5/2026** - Accepted by Product Owner