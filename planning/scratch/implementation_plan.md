# Implement Logs API Endpoint

Implement `GET /api/experiments/:id/logs` to retrieve experiment logs with filtering and pagination.

## Proposed Changes

### Experiment Controller

#### [MODIFY] [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)

Add `getExperimentLogs` function:
- Validate ObjectId format (400 if invalid)
- Check experiment exists (404 if not)
- Build query with optional filters:
  - `?step=N` - filter by stepNumber
  - `?source=<string>` - filter by source (any string accepted)
- Pagination with defaults:
  - `?limit=50` (default 50, max 500)
  - `?offset=0` (default 0)
- Sort by `timestamp: 1` (chronological, oldest first)
- Return array of log entries with `data` field when present

---

### Experiment Routes

#### [MODIFY] [experiment.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/experiment.routes.js)

Add route: `GET /:id/logs` → `experimentController.getExperimentLogs`

---

### Tests

#### [MODIFY] [experiment.routes.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/experiment.routes.test.js)

Add `describe('GET /api/experiments/:id/logs')` block with tests for:
- Returns logs array for valid experiment
- Returns 404 for non-existent experiment
- Step filter (`?step=N`) works
- Source filter (`?source=X`) works
- Pagination (`?limit=N&offset=M`) works
- Logs in chronological order
- Empty array for experiment with no logs
- 400 for invalid ObjectId

## Verification Plan

### Automated Tests
```bash
npm test -- --testPathPattern=experiment.routes.test.js
```
