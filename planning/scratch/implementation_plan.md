# Implementation Plan - Logger Service (Story 019)

## Goal Description
Implement a persistent `Logger` service that subscribes to the `EventBus` and records `LogEntry` documents to MongoDB. This ensures that all experiment activities, both explicit logs and lifecycle events, are preserved for audit and review.

## User Review Required
None.

## Proposed Changes

### Backend

#### [NEW] [logger.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/logger.service.js)
- Create `Logger` class.
- Constructor takes `EventBus` instance.
- Subscribes to `LOG` event.
- Subscribes to `EXPERIMENT_START`, `STEP_START`, `EXPERIMENT_END` events to auto-generate logs.
- Uses `Log` Mongoose model to save entries.

## Verification Plan

### Automated Tests
- Create `backend/test/services/logger.service.test.js`.
- Use `mongodb-memory-server` for DB.
- Mock `EventBus` (or use real one).
- Test cases:
    - Explicit `LOG` event results in DB document.
    - `EXPERIMENT_START` creates "Experiment Initialized" log.
    - `STEP_START` creates "Step N Started" log.
    - Verify fields: `experimentId`, `stepNumber`, `source`, `message`, `data`.
