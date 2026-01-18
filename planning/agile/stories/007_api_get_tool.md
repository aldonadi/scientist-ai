# Implement Get Tool Details API

- **Status:** DONE
- **Points:** 1
- **Story ID:** 007
- **Type:** Feature

## Description
Implement the `GET /api/tools/:id` endpoint to retrieve the details of a specific tool by its ID.

## User Story
**As a** User or System Orchestrator,
**I want** to view tool details,
**So that** I can examine its code, parameters, and configuration before using or editing it.

## Acceptance Criteria

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/tools/:id`
- **Parameters**::
    - `id` (path): The MongoDB ObjectId of the tool to retrieve.

### Behavior
- [x] Validates that `id` is a valid MongoDB ObjectId.
- [x] Returns 400 Bad Request if `id` is invalid.
- [x] Queries the `Tools` collection for the document with `_id: id`.
- [x] Returns 404 Not Found if no document exists.
- [x] Returns 200 OK with the tool object if found.

### Response Codes
- **200 OK**: Successfully retrieved the tool.
- **400 Bad Request**: Invalid ID format.
- **404 Not Found**: Tool with the specified ID does not exist.
- **500 Internal Server Error**: Database error.

### Response Data Format
```json
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
```

## Technical Implementation Notes
- Use `Tool.findById(id)`.
- Use a utility or middleware to validate ObjectId format (e.g. `mongoose.Types.ObjectId.isValid()`).

## Testing
### Automated Tests
- Create a test file `backend/tests/api/tool/get_tool.test.js`.
- **Test Cases**:
    1.  **Get Existing**: Seed a tool, call `GET /api/tools/:id` with its ID. Verify 200 OK and correct JSON body.
    2.  **Get Non-Existent**: Generate a valid random ObjectId that doesn't exist in DB. Call `GET /api/tools/:id`. Verify 404 Not Found.
    3.  **Invalid ID**: Call `GET /api/tools/invalid-id-string`. Verify 400 Bad Request.

### Manual Verification
1.  Seed DB.
2.  `curl http://localhost:3000/api/tools/<valid_id>` -> 200 JSON.
3.  `curl http://localhost:3000/api/tools/000000000000000000000000` -> 404.
4.  `curl http://localhost:3000/api/tools/bad-id` -> 400.

## Review Log
- Ensure standard error format is used (e.g., `{ error: "Message" }`).
**1/4/26** - Other tests failing now: fix regressions.
**1/4/26** - Accepted by Product Owner.
