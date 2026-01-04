# Implementation Plan - Global Error Handling

This plan outlines the steps to implement a centralized error handling mechanism for the Scientist AI backend.

## User Review Required

> [!NOTE]
> I will be creating new directories `src/utils` and `src/middleware`.

## Proposed Changes

### Backend

#### [NEW] [AppError.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/utils/AppError.js)
- Create a custom `AppError` class extending `Error`.
- Properties: `statusCode`, `status`, `isOperational`.

#### [NEW] [errorHandler.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/middleware/errorHandler.js)
- Create a global error handling middleware function.
- Signature: `(err, req, res, next)`.
- Logic:
    - Set default status code (500) and status ('error').
    - Send JSON response: `{ error: true, message: err.message, stack: ... }` (stack only in dev).

#### [MODIFY] [index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/index.js)
- Import `AppError` and `errorHandler`.
- Handle undefined routes (404) by forwarding to `errorHandler`.
- Use `errorHandler` as the last middleware.

## Verification Plan

### Automated Tests
I will create a new test file `backend/tests/error.test.js` using `jest` and `supertest` to verify the error handling.

**Command:**
```bash
cd backend && npm test tests/error.test.js
```

**Test Cases:**
1.  **404 Not Found:** Request a non-existent route -> Expect 404 and JSON error.
2.  **Operational Error:** Trigger a known error (if possible/mocked) -> Expect specific status code.
3.  **Generic Error:** Trigger an unhandled exception -> Expect 500 and JSON error.
