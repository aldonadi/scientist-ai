# Implement Delete Plan API

- **Status:** READY
- **Points:** 1
- **Story ID:** 045
- **Type:** Feature

## Description
Implement the `DELETE /api/plans/:id` endpoint to allow users to permanently remove an Experiment Plan.

## User Story
**As a** User,
**I want** to delete an old or incorrect plan,
**So that** I can keep my workspace organized and avoid confusion.

## Request Specification
**Endpoint**: `DELETE /api/plans/:id`

### constraints
- **Referential Integrity**: 
    - Ideally, we should check if any **Experiments** reference this plan.
    - If an Experiment references this plan, we should **Soft Delete** (mark as archived).
    - *Decision for MVP*: Hard Delete is acceptable, but logging a warning if experiments exist is a plus. For strict safety, if `Experiments` exist with this `planId`, return 400 or 409.

## Response Specification

### Success (200 OK)
Returns the deleted document or a success message.
```json
{
  "message": "Plan deleted successfully",
  "id": "60d5ecb8b487343510eabcde"
}
```

### Errors
- **400 Bad Request**: Invalid ID format.
- **404 Not Found**: Plan ID does not exist.
- **409 Conflict**: Plan is in use by an Experiment.
- **500 Internal Server Error**: Database failures.

## Acceptance Criteria
- [ ] Returns 200 OK on successful deletion.
- [ ] Returns 404 if plan not found.
- [ ] Returns 400 if ID is invalid.
- [ ] Returns 409 if active experiments are using this plan.

## Testing Rules
1. **Unit/Integration Tests**:
    - `DELETE /api/plans/:id` with valid, unused ID -> 200.
    - `DELETE /api/plans/:id` with non-existent ID -> 404.
    - `DELETE /api/plans/:id` with invalid ID -> 400.
    - `DELETE` with ID used by an Experiment -> 409.

## Review Log
