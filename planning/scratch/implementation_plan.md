# Implementation Plan - List Tools API (Story 006)

This plan outlines the steps to implement the `GET /api/tools` endpoint, allowing users to list available tools with optional namespace filtering.

## User Review Required

> [!NOTE]
> No breaking changes are expected. The response format strictly follows the specification.

## Proposed Changes

### Backend

#### [MODIFY] [tools.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/tools.js)
- Implement `GET /` handler.
- Use `Tool.find()` with dynamic query construction based on `req.query.namespace`.
- Return 200 OK with JSON array of tools.
- Handle 500 errors.

### Testing

#### [NEW] [list_tools.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/tool/list_tools.test.js)
- Create a new test file for the list endpoint.
- **Tests**:
    1.  `GET /api/tools` returns all tools.
    2.  `GET /api/tools?namespace=...` returns filtered tools.
    3.  `GET /api/tools` returns empty array when no tools exist.
    4.  Verify response structure matches schema.

## Verification Plan

### Automated Tests
Run the specific test file:
```bash
npm test tests/api/tool/list_tools.test.js
```

### Manual Verification
1.  Start server: `npm start`
2.  Use curl to check endpoints:
    ```bash
    curl http://localhost:3000/api/tools
    curl http://localhost:3000/api/tools?namespace=default
    ```
