# Implement Create Tool API

This plan outlines the implementation of the `POST /api/tools` endpoint, allowing the registration of new tools in the system.

## User Review Required

> [!IMPORTANT]
> I will be adding `zod` as a new dependency for request validation. Please ensure this is acceptable.

## Proposed Changes

### Backend

#### [NEW] [tool.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/tool.controller.js)
- Implement `createTool` function.
- Validate request body using `zod`.
- Check for existing tool (namespace + name uniqueness handled by DB index, but we can catch the error or check beforehand. DB error handling is cleaner for concurrent requests, but `409` mapping in controller is good).
- Save to DB.
- Handle errors (400 for validation, 409 for conflict, 500 for others).

#### [NEW] [tool.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/tool.routes.js)
- Define `POST /` route.
- Link to `toolController.createTool`.

#### [MODIFY] [index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/index.js)
- Import and mount `toolRoutes` at `/api/tools`.

#### [MODIFY] [package.json](file:///home/andrew/Projects/Code/web/scientist-ai/backend/package.json)
- Add `zod` dependency.

## Verification Plan

### Automated Tests
I will create a new integration test file: `backend/tests/integration/tool.api.test.js`.

**Run Command:**
```bash
cd backend && npm test tests/integration/tool.api.test.js
```

**Test Scenarios:**
1.  **Happy Path**: POST valid tool -> 201 Created. Verify DB.
2.  **Validation Error**: Missing 'name' -> 400 Bad Request.
3.  **Validation Error**: Invalid 'parameters' (not object) -> 400 Bad Request.
4.  **Conflict**: POST duplicate tool -> 409 Conflict.
5.  **Sanitization**: Check if 'code' and 'description' are saved correctly stringified.

### Manual Verification
N/A - Coverage provided by automated integration tests.
