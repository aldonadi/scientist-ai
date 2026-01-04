# Implement List Tools API

- **Status:** DONE
- **Points:** 2
- **Story ID:** 006
- **Type:** Feature

## Description
Implement the `GET /api/tools` endpoint to retrieve a list of all available tools in the system. The endpoint should support filtering by `namespace` via query parameters.

## User Story
**As a** User or System Orchestrator,
**I want** to retrieve a list of available tools,
**So that** I can discover what capabilities are available for use in experiments and see which namespace they belong to.

## Acceptance Criteria

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/tools`
- **Query Parameters**:
    - `namespace` (optional): Filter tools by their `namespace` field (exact match).

### Behavior
- [X] If no `namespace` is provided, return all tools from the `Tools` collection.
- [X] If `namespace` is provided, return only tools matching that namespace.
- [X] Returns a JSON array of tool objects.

### Response Codes
- **200 OK**: Successfully retrieved the list (returns empty array `[]` if no tools found).
- **500 Internal Server Error**: If there is a database connection issue or query failure.

### Response Data Format
```json
[
  {
    "_id": "60d5ec...",
    "name": "example_tool",
    "namespace": "default",
    "description": "Tool description...",
    "parameters": {},
    "code": "...",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

## Technical Implementation Notes
- Use the `Tool` Mongoose model.
- Use `Tool.find(filter)` where filter is constructed based on query params.

## Testing
### Automated Tests
- Create a test file `backend/tests/api/tool/list_tools.test.js`.
- **Test Cases**:
    1.  **List All**: Seed DB with 3 tools (2 in 'default', 1 in 'custom'). Call `GET /api/tools` and verify 3 items returned.
    2.  **Filter by Namespace**: Call `GET /api/tools?namespace=custom` and verify only 1 item returned.
    3.  **Empty List**: Clear DB, call `GET /api/tools`, verify empty array `[]` is returned.
    4.  **Database Error**: Mock a DB error and verify 500 status code.

### Manual Verification
1.  Start the server.
2.  Use Postman or Curl: `curl http://localhost:3000/api/tools` -> Expect array.
3.  `curl http://localhost:3000/api/tools?namespace=system` -> Expect filtered array.

## Review Log
- Ensure the response shape matches the defined schema in Story 004.

**1/4/2026** - Accepted by Product Owner.