# Task: Implement Experiment CRUD API (Story 048)

## Objective
Implement missing Experiment API endpoints for listing, getting, and deleting experiments.

## Checklist

### Planning
- [x] Review existing codebase and patterns
- [x] Ask clarifying questions
- [x] Create implementation plan

### Implementation
- [x] Update `experiment.controller.js` with new methods:
    - [x] `listExperiments` - GET /api/experiments with optional status filter
    - [x] `getExperiment` - GET /api/experiments/:id  
    - [x] `deleteExperiment` - DELETE /api/experiments/:id (with log cleanup)
- [x] Update `experiment.routes.js` with new routes

### Testing
- [x] Extend `experiment.routes.test.js` with tests for:
    - [x] List experiments returns array
    - [x] List with valid status filter works
    - [x] List with invalid status filter returns 400
    - [x] Get single experiment returns full document
    - [x] Get returns 404 for missing
    - [x] Get returns 400 for invalid ID
    - [x] Delete returns 400 for RUNNING experiment
    - [x] Delete returns 400 for PAUSED experiment
    - [x] Delete returns 204 for COMPLETED experiment
    - [x] Delete returns 404 for missing
    - [x] Delete also removes associated logs

### Verification
- [x] Run all tests
- [x] Verify no regressions

### Documentation
- [x] Update story checkboxes
- [x] Update backlog status
