# Implement Launch Experiment API

## User Review Required
No breaking changes.

## Proposed Changes
### Backend
#### [NEW] [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)
- Implement `launchExperiment` function:
    - Validate `planId` in body.
    - Fetch `ExperimentPlan`.
    - Create `Experiment` with status `INITIALIZING`.
    - Copy `initialEnvironment` from plan.
    - Save and return.

#### [NEW] [experiment.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/experiment.routes.js)
- Define `POST /` mapped to `launchExperiment`.

#### [MODIFY] [app.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)
- Import `experimentRoutes`.
- Mount at `/api/experiments`.

### Tests
#### [NEW] [experiment.routes.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/experiment.routes.test.js)
- Test `POST /api/experiments`:
    - Success case: Verify 201, returned ID, status INITIALIZING, environment copied.
    - Error cases:
        - Missing `planId` (400).
        - Invalid `planId` format (400).
        - Plan not found (404).

## Verification Plan
### Automated Tests
- Run `npm test backend/tests/api/experiment.routes.test.js`
