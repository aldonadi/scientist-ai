# Fix Frontend-Backend Integration Implementation Plan

## Goal Description
The frontend application (Angular) is currently unable to communicate with the backend API due to missing proxy configuration and a missing `ExperimentService`. This plan outlines the steps to configure the development proxy and implement the missing service and component logic to enable Experiment management from the UI.

## User Review Required
> [!NOTE]
> This change introduces a proxy configuration for development (`ng serve`) to forward `/api` requests to `localhost:3000`. This is standard practice but relies on the backend running on port 3000.

## Proposed Changes

### Frontend Configuration
#### [NEW] [proxy.conf.json](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/proxy.conf.json)
- Create a new file to map `/api` requests to `http://localhost:3000`.

#### [MODIFY] [angular.json](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/angular.json)
- Update the `serve` architect target to include `"proxyConfig": "src/proxy.conf.json"`.

### Frontend Services
#### [NEW] [experiment.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/experiment.service.ts)
- Implement `ExperimentService` with methods:
    - `getExperiments()`
    - `getExperiment(id)`
    - `createExperiment(planId)`
    - `controlExperiment(id, command)`
    - `getLogs(id)`
- Use `HttpClient` and follow patterns from `PlanService`.

### Frontend Components
#### [MODIFY] [experiment-list.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-list.component.ts)
- Inject `ExperimentService`.
- Fetch experiments on `ngOnInit`.
- Display the list of experiments (name, status, etc.).

## Verification Plan

### Automated Tests
- Run `ng test` to verify the new generic `ExperimentService` and updated `ExperimentListComponent`.
```bash
cd frontend
npm test
```

### Manual Verification
1.  **Start Backend**: Ensure backend is running (`npm run dev` in `backend`).
2.  **Start Frontend**: Run `npm start` in `frontend` (this runs `ng serve`).
3.  **Check Network**: Open browser to `http://localhost:4200/experiments`. Inspect Network tab. 
4.  **Verify**: Confirm `GET /api/experiments` returns a 200 OK response (JSON array) and not a 404 HTML error.
