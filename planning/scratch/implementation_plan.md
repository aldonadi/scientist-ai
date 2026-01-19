# Implementation Plan - System Health Modal

This plan describes the changes required to implement the "System Health" modal and the underlying backend support.

## User Review Required
> [!NOTE]
> The current backend `/api/health` endpoint is minimal. I will expand it to include database status, uptime, and container pool statistics.
> The frontend `HealthStatus` interface will be updated to match the new API response.

## Proposed Changes

### Backend

#### [MODIFY] [container-pool.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js)
- Maintain a list (or set) of `activeContainers` (containers leased out via `acquire`).
- When `acquire()` is called, add the container to `activeContainers`.
- When a container is destroyed (users of `Container` are responsible for calling `destroy()`), it needs to be removed from `activeContainers`.
- **Refactor**: Wrap the returned Container's `destroy` method so that it automatically removes itself from the `ContainerPoolManager`'s active list when called. This prevents leaking references if the consumer forgets to notify the pool.

#### [MODIFY] [app.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)
- Update `/api/health` to include `active` count from `containerPool.activeContainers.size` (or length).


### Frontend

#### [MODIFY] [header.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/layout/header.component.ts)
- Update `HealthStatus` interface to match new API response.
- Add `openSystemHealth()` method.
- Import `SystemHealthModalComponent` (to be created).
- Add click handler to the status badge.

#### [NEW] [system-health-modal.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/layout/system-health-modal.component.ts)
- Create a standalone Angular component for the modal.
- It will accept the `HealthStatus` data as input (or fetch it execution-time, but passing data from header is faster/easier if header is already polling).
- Display the metrics defined in User Story 064.

#### [NEW] [system-health-modal.component.html](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/layout/system-health-modal.component.html)
- Template for the modal.
- Use Tailwind classes for "nerdy/hackerish" aesthetic (monospace fonts, terminal-like colors perhaps, or just clean modern UI as requested "nice, hackerish/nerdy").

## Verification Plan

### Automated Tests
- **Backend Health Endpoint**:
    - Run `curl http://localhost:3000/api/health` and verify the JSON structure contains all new fields.
    - I can write a small test script or just use `curl` via `run_command`.

### Manual Verification
1.  Start backend (`npm run start` in `backend/`).
2.  Start frontend (`npm run start` in `frontend/`).
3.  Open browser (via `browser_subagent` or asking user since I can't interactively click).
4.  *Actually using `browser_subagent`*:
    - Navigate to the app.
    - Click the status badge.
    - Verify modal content properly displays uptime, DB status, and container info.

