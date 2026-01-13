# Fix Frontend-Backend Integration

- **Status:** DONE
- **Points:** 3
- **Story ID:** 059
- **Type:** Bugfix

## Description
The frontend is currently disconnected from the backend. The Angular application lacks a proxy configuration to forward API requests to the backend server during development. Additionally, the `ExperimentService` is missing, and the `ExperimentListComponent` does not implemented data loading logic. This story covers the necessary fixes to establishment full integration between the frontend and backend for the Experiment domain.

## User Story
**As a** Developer,
**I want** the frontend to correctly communicate with the backend API,
**So that** I can manage experiments from the UI without 404 errors.

## Acceptance Criteria
- [ ] **Proxy Configuration**:
    - `frontend/src/proxy.conf.json` exists and forwards `/api` to `http://localhost:3000`.
    - `angular.json` is updated to use this proxy configuration for the `serve` target.
- [ ] **Experiment Service**:
    - `ExperimentService` (`frontend/src/app/core/services/experiment.service.ts`) is implemented.
    - Supports methods: `getExperiments`, `getExperiment`, `createExperiment`, `updateExperiment`, `deleteExperiment`, `controlExperiment`, `getLogs`.
- [ ] **Experiment List UI**:
    - `ExperimentListComponent` successfully fetches the list of experiments from the API on initialization.
    - Displays the experiments (basic name/status list is sufficient for this story, detailed monitoring is separate).
- [ ] **Verification**:
    - Start the app and verify `GET /api/experiments` returns 200 OK (even if empty list) instead of 404.

## Testing
1. **Automated**: Run `ng test` to ensure the new service and component changes pass unit tests.
2. **Manual**: 
    - Start backend (`npm run dev` in backend).
    - Start frontend (`npm start` in frontend).
    - Navigate to `/experiments` (or the default route if redirected).
    - Inspect Network tab in browser DevTools to confirm `/api/experiments` request is successful (200 OK) and returns JSON.
