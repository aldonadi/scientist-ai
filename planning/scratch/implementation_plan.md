# Implementation Plan - Backend Error Handling (Story 003)

## Goal Description
Implement a centralized error handling middleware for the Express application to ensure consistent API error responses. This will handle 404 (Not Found) and 500 (Internal Server Error) scenarios, ensuring all error responses follow a standard JSON format: `{ error: true, message: '...' }`.

## Proposed Changes

### Backend

#### [NEW] `backend/src/middleware/errorHandler.js`
- Create a middleware function `notFoundHandler` to catch 404s.
- Create a middleware function `errorHandler` to handle exceptions.
- Ensure the response format is `{ error: true, message: '...' }`.
- Log the full error stack (for server errors) to the console (or logger in the future).

#### [MODIFY] `backend/src/index.js`
- Import the new middleware.
- Apply `notFoundHandler` after all routes.
- Apply `errorHandler` as the very last middleware.

## Verification Plan

### Automated Verification
- Create a test script (or use `curl`) to hit:
    1. A non-existent route (expect 404 and standard JSON).
    2. A route that simulates an error (will add a temporary test route for this).

### Manual Verification
- Run the server.
- Request `GET /api/non-existent-route` -> Expect 404 `{ "error": true, "message": "Not Found" }`.
- Request a route that throws an error -> Expect 500 `{ "error": true, "message": "Internal Server Error" }`.
