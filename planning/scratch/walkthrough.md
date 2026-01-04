# Walkthrough - Backend Error Handling (Story 003)

I have implemented a centralized error handling mechanism for the Express backend and added a permanent automated test suite.

## Changes

### 1. New Middleware
Created `backend/src/middleware/errorHandler.js` containing:
- `notFoundHandler`: Captures requests to non-existent routes and forwards them as 404 errors.
- `errorHandler`: Captures all exceptions, formats them into a standard JSON response, and sets the appropriate HTTP status code.

### 2. Application Update
Modified `backend/src/index.js` to register the new middleware at the end of the middleware chain.

### 3. Automated Testing
Created `backend/test/middleware/errorHandler.test.js` to verify:
- 404 for non-existent routes.
- 400 for bad requests.
- 500 for internal server errors.
- Stack trace suppression in production.

Added `test` script to `package.json` to run Jest.

## verification Results

### Automated Tests
Ran `npm test` which executes the Jest test suite.

**Result:**
```
 PASS  test/middleware/errorHandler.test.js
  Error Handling Middleware
    ✓ should return 404 for non-existent routes
    ✓ should return 400 for bad requests
    ✓ should return 500 for internal server errors
    ✓ should hide stack trace in production

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.234 s
```
