# Implement Experiment CRUD API (Story 048)

Implement the missing Experiment API endpoints for listing, getting, and deleting experiments per SPEC §5.

## Proposed Changes

### Controller Layer

#### [MODIFY] [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)

Add three new controller methods:

1. **`listExperiments`** 
   - Query all experiments with optional `?status=` filter
   - Validate status against allowed enum: `INITIALIZING`, `RUNNING`, `PAUSED`, `COMPLETED`, `FAILED`, `STOPPED`
   - Return 400 for invalid status values
   - Return all fields: `_id, planId, status, currentStep, startTime, endTime, result`

2. **`getExperiment`**
   - Validate ObjectId format using regex `/^[0-9a-fA-F]{24}$/`
   - Return 400 for invalid ID format
   - Return 404 for non-existent experiment
   - Return full document including `currentEnvironment`

3. **`deleteExperiment`**
   - Validate ObjectId format
   - Return 400 for RUNNING or PAUSED experiments (cannot delete active experiments)
   - Return 404 for non-existent experiment
   - Delete experiment and associated logs from `Log` collection
   - Return 204 No Content on success
   - Include `// TODO: Future - consider soft delete/archive` comment for extensibility

---

### Routes Layer

#### [MODIFY] [experiment.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/experiment.routes.js)

Add new routes:
```javascript
router.get('/', experimentController.listExperiments);
router.get('/:id', experimentController.getExperiment);
router.delete('/:id', experimentController.deleteExperiment);
```

---

## Verification Plan

### Automated Tests

**File**: [experiment.routes.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/experiment.routes.test.js)

**Command to run**:
```bash
cd /home/andrew/Projects/Code/web/scientist-ai/backend && npm test -- tests/api/experiment.routes.test.js
```

**New test cases to add**:

| Test Case | Expected Result |
|-----------|-----------------|
| List experiments returns empty array when none exist | 200, `[]` |
| List experiments returns all experiments | 200, array with experiments |
| List with valid status filter `?status=RUNNING` | 200, filtered array |
| List with invalid status filter `?status=INVALID` | 400 error |
| Get single experiment returns full document | 200, includes `currentEnvironment` |
| Get returns 404 for non-existent ID | 404 |
| Get returns 400 for invalid ObjectId format | 400 |
| Delete RUNNING experiment returns 400 | 400 |
| Delete PAUSED experiment returns 400 | 400 |
| Delete COMPLETED experiment returns 204 | 204 No Content |
| Delete FAILED experiment returns 204 | 204 |
| Delete STOPPED experiment returns 204 | 204 |
| Delete non-existent experiment returns 404 | 404 |
| Delete also removes associated logs | Logs deleted from DB |

**Full test suite**:
```bash
cd /home/andrew/Projects/Code/web/scientist-ai/backend && npm test
```
