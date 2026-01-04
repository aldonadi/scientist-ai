# Walkthrough - Backend Error Handling (Story 003)

I have implemented a centralized error handling mechanism for the Express backend. This ensures that all API errors return a consistent JSON structure.

## Changes

### 1. New Middleware
Created `backend/src/middleware/errorHandler.js` containing:
- `notFoundHandler`: Captures requests to non-existent routes and forwards them as 404 errors.
- `errorHandler`: Captures all exceptions, formats them into a standard JSON response, and sets the appropriate HTTP status code.

### 2. Application Update
Modified `backend/src/index.js` to register the new middleware at the end of the middleware chain.

## verification Results

### Automated Tests
I ran a temporary test script and manual `curl` commands to verify the behavior.

#### 404 Test
Requesting a non-existent URL:
`GET /api/this-does-not-exist`

**Response:**
```json
{
  "error": true,
  "message": "Not Found - /api/this-does-not-exist",
  "stack": "..."
}
```
**Status:** 404 Not Found

#### 500 Test
Simulating an internal server error:

**Response:**
```json
{
  "error": true,
  "message": "Forced Error",
  "stack": "..." 
}
```
**Status:** 500 Internal Server Error (Verified in server logs)
