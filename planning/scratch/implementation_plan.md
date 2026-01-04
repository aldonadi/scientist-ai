# Backend Error Handling Implementation Plan

This plan outlines the steps to implement a centralized error handling middleware for the backend API, ensuring consistent JSON error responses.

## User Review Required

> [!NOTE]
> Ensure you run `npm install` in the `backend` directory if you haven't already.

## Proposed Changes

### Backend

#### [NEW] [errorHandler.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/middleware/errorHandler.js)
- Create a new middleware file to handle errors.
- It will export two functions:
    - `notFound`: Middleware to handle 404 Not Found errors.
    - `errorHandler`: Global error handling middleware.
- Response format:
  ```json
  {
    "error": true,
    "message": "Error message content"
  }
  ```

#### [MODIFY] [index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/index.js)
- Import the new middleware.
- Register `notFound` middleware after all routes.
- Register `errorHandler` middleware as the last middleware.
- Add a test route `/api/error-test` (temporary or permanent?) -> I'll stick to manual verification or a dedicated test file rather than polluting `index.js` permanently, but for verification I might add a temporary route or just rely on a non-existent route for 404. For 500, I can use a script to mock a failure or add a temporary route. I will add a temporary route `/api/debug/error` to trigger a 500 error for testing purposes.

## Verification Plan

### Automated Tests
- None existing for this specific feature.

### Manual Verification
1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   (Assuming `npm run dev` exists, I saw `nodemon` or similar in `package.json`? I should check `package.json` scripts first. If no `dev` script, I'll use `node src/index.js`).

2. **Verify 404**:
   - Run: `curl -i http://localhost:3000/api/non-existent-route`
   - Expect: 404 status and JSON `{ "error": true, "message": "Not Found - ..." }`

3. **Verify 500**:
   - I will add a temporary route `/api/health/error` that throws an error.
   - Run: `curl -i http://localhost:3000/api/health/error`
   - Expect: 500 status and JSON `{ "error": true, "message": "..." }`
