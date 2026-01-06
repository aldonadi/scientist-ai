# Launch Experiment API Walkthrough

I have implemented the `POST /api/experiments` endpoint which allows launching a new experiment from a plan.

## Changes
- **Controller**: `experiment.controller.js` implements the logic to create an `Experiment` from an `ExperimentPlan`.
- **Routes**: `experiment.routes.js` maps the endpoint.
- **App**: Mounted the new routes at `/api/experiments`.
- **Tests**: Added `experiment.routes.test.js` covering success and error scenarios.

## Verification Results
### Automated Tests
Ran `npm test tests/api/experiment.routes.test.js`:
```
PASS  tests/api/experiment.routes.test.js
  Experiment API Integration Tests
    POST /api/experiments
      ✓ should launch a new experiment from a valid plan (216 ms)
      ✓ should fail if planId is missing (26 ms)
      ✓ should fail if planId is invalid format (38 ms)
      ✓ should fail if plan does not exist (27 ms)
```

## Usage
```bash
curl -X POST http://localhost:3000/api/experiments \
  -H "Content-Type: application/json" \
  -d '{"planId": "65e..."}'
```
