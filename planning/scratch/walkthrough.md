# Walkthrough - Logger Service (Story 019)

I have implemented the persistent `Logger` service as requested.

## Changes

### 1. Logger Service
Implemented `Logger` class in `backend/src/services/logger.service.js`.
- It subscribes to the `EventBus` for the `LOG` event and writes to MongoDB using the `Log` model.
- It also subscribes to `EXPERIMENT_START`, `STEP_START`, and `EXPERIMENT_END` events to automatically generate system logs without explicit calls from the business logic.

### 2. Tests
Created `backend/test/services/logger.service.test.js`.
- Verified that `LOG` events create database entries.
- Verified that lifecycle events (`EXPERIMENT_START`, etc.) create database entries with correct formatting.
- Verified error handling (silent failure on DB error to avoid crashing the process).

## Verification Results

### Automated Tests
Ran `jest test/services/logger.service.test.js` in the backend directory.

```
 PASS  test/services/logger.service.test.js
  Logger Service
    ✓ should create a log entry when LOG event is emitted (150 ms)
    ✓ should invalid log entry fail silently (console error) but not crash (117 ms)
    ✓ should auto-log EXPERIMENT_START (116 ms)
    ✓ should auto-log STEP_START (112 ms)
    ✓ should auto-log EXPERIMENT_END (111 ms)
```
