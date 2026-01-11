# Implement Logs API

- **Status:** READY
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
- [ ] `GET /api/experiments/:id/logs` endpoint implemented:
    - [ ] Returns array of log entries for the experiment
    - [ ] Supports `?step=N` query parameter to filter by step number
    - [ ] Supports `?source=SYSTEM|HOOK|MODEL` filter
    - [ ] Returns logs in chronological order (oldest first)
    - [ ] Returns 404 if experiment doesn't exist
- [ ] Unit tests cover all scenarios
- [ ] Pagination support (optional, can defer)

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/logs.routes.test.js`
- **Cases**:
    - Get logs returns array
    - Get logs with step filter works
    - Get logs returns 404 for missing experiment
    - Logs are in chronological order

## Technical Notes
- Create new route in `experiment.routes.js` or separate `logs.routes.js`
- Query the Log model by experimentId
- Consider pagination for large log sets

## Review
