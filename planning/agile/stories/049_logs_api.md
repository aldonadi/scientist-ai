# Implement Logs API

- **Status:** REVIEW
- **Points:** 3
- **Story ID:** 049
- **Type:** Feature

## Description
Implement the missing Logs API endpoint for retrieving experiment logs. The Logger service already persists logs to MongoDB, but there is no API endpoint to query them.

- `GET /api/experiments/:id/logs` - Get logs for an experiment with optional step filter

### Review Finding Reference
- **Source**: Third-Party Review 1 (C4), Third-Party Review 2 (Section 1)
- **Severity**: HIGH
- **Impact**: Users cannot view experiment logs

## User Story
**As a** User,
**I want** to retrieve logs from my experiments,
**So that** I can debug issues and understand experiment behavior.

## Acceptance Criteria
- [x] `GET /api/experiments/:id/logs` endpoint implemented:
    - [x] Returns array of log entries for the experiment
    - [x] Supports `?step=N` query parameter to filter by step number
    - [x] Supports `?source=<string>` filter (accepts any source string)
    - [x] Returns logs in chronological order (oldest first)
    - [x] Returns 404 if experiment doesn't exist
- [x] Unit tests cover all scenarios
- [x] Pagination support (`?limit=N&offset=M`)

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/api/experiment.routes.test.js`
- **Cases** (18 tests added):
    - Get logs returns array
    - Get logs with step filter works
    - Get logs with source filter works
    - Combined filters work
    - Get logs returns 404 for missing experiment
    - Logs are in chronological order
    - Empty array for experiment with no logs
    - Pagination limit/offset works
    - hasMore pagination metadata correct
    - Data field included when present, excluded when not

## Technical Notes
- Added route in `experiment.routes.js`: `GET /:id/logs`
- Added `getExperimentLogs` controller in `experiment.controller.js`
- Pagination: default limit 50, max 500
- Response format: `{ logs: [...], pagination: { total, limit, offset, hasMore } }`

## Review
Implementation complete. All 18 new tests pass (39 total in experiment routes).
