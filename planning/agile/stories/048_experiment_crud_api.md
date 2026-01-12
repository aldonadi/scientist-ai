# Implement Experiment CRUD API

- **Status:** REVIEW
- **Points:** 5
- **Story ID:** 048
- **Type:** Bug/Feature

## Description
Implement the missing Experiment API endpoints for reading and deleting experiments. Currently only `POST /api/experiments` (launch) and `POST /api/experiments/:id/control` exist. The following endpoints are missing and required per SPEC §5:

- `GET /api/experiments` - List all experiments with optional status filter
- `GET /api/experiments/:id` - Get a single experiment with full status and environment
- `DELETE /api/experiments/:id` - Delete an ended experiment (only when status is COMPLETED, FAILED, or STOPPED)

### Review Finding Reference
- **Source**: Third-Party Review 1 (C1-C3), Third-Party Review 2 (Section 1)
- **Severity**: CRITICAL
- **Impact**: Users cannot observe experiment status or delete completed experiments

## User Story
**As a** User,
**I want** to view the list and status of my experiments and delete completed ones,
**So that** I can monitor experiment progress and clean up old experiments.

## Acceptance Criteria
- [x] `GET /api/experiments` endpoint implemented:
    - [x] Returns array of all experiments
    - [x] Supports `?status=RUNNING` query parameter filter
    - [x] Returns experiment summary (id, planId, status, currentStep, startTime)
- [x] `GET /api/experiments/:id` endpoint implemented:
    - [x] Returns full experiment document including `currentEnvironment`
    - [x] Returns 404 for non-existent experiments
    - [x] Returns 400 for invalid ObjectId format
- [x] `DELETE /api/experiments/:id` endpoint implemented:
    - [x] Returns 400 if experiment status is RUNNING or PAUSED
    - [x] Returns 404 for non-existent experiments
    - [x] Successfully deletes COMPLETED, FAILED, or STOPPED experiments
    - [x] Returns 204 No Content on success
- [x] Unit tests cover all endpoints and edge cases
- [x] API documentation updated

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/experiment.routes.test.js` (extend existing)
- **Cases**:
    - List experiments returns array
    - List with status filter works
    - Get single experiment returns full document
    - Get returns 404 for missing
    - Get returns 400 for invalid ID
    - Delete returns 400 for RUNNING experiment
    - Delete returns 204 for COMPLETED experiment
    - Delete returns 404 for missing

## Technical Notes
- Add routes to `experiment.routes.js`
- Add controller methods to `experiment.controller.js`
- Follow patterns from `plan.controller.js` for CRUD operations
- Handle CastError for invalid ObjectId to return 400 not 500

## Review
