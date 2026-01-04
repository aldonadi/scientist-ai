# Implement Delete Tool API

- **Status:** READY
- **Points:** 1
- **Story ID:** 009
- **Type:** Feature

## Description
Implement the `DELETE /api/tools/:id` endpoint to permanently remove a tool from the system.

## User Story
**As a** User or System Orchestrator,
**I want** to delete tools that are no longer needed,
**So that** I can declutter the workspace and prevent accidentally using deprecated tools.

## Acceptance Criteria

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/tools/:id`
- **Parameters**:
    - `id` (path): MongoDB ObjectId.

### Behavior
- [ ] Validates `id` format.
- [ ] Returns 400 Bad Request if `id` is invalid.
- [ ] Attempts to find and delete the tool with the given `id` from the `Tools` collection.
- [ ] Returns 200 OK (with deleted doc) or 204 No Content if successful. (Recommendation: 200 OK with the deleted object is often helpful for UI undo actions, but 204 is also standard. Let's strictly return 200 OK with JSON `{ message: "Tool deleted", id: "..." }` to be explicit).
- [ ] Returns 404 Not Found if the tool with that ID does not exist.

### Response Codes
- **200 OK**: Tool successfully deleted.
- **400 Bad Request**: Invalid ID format.
- **404 Not Found**: Tool not found (already deleted or never existed).
- **500 Internal Server Error**: Database error.

### Response Data Format
```json
{
  "message": "Tool deleted successfully",
  "id": "60d5ec..."
}
```

## Technical Implementation Notes
- Use `Tool.findByIdAndDelete(id)`.
- Ensure proper logging of this destructive action.

## Testing
### Automated Tests
- Create a test file `backend/tests/api/tool/delete_tool.test.js`.
- **Test Cases**:
    1.  **Delete Existing**: Create a tool, delete it via API. Verify 200 OK. Try to `GET` it afterwards, verify 404.
    2.  **Delete Non-Existent**: Call DELETE on a random valid ObjectId. Verify 404.
    3.  **Invalid ID**: Call DELETE on `invalid-id`. Verify 400.

### Manual Verification
1.  Seed DB with a tool.
2.  `curl -X DELETE http://localhost:3000/api/tools/<id>`.
3.  Verify response and check DB to ensure it's gone.

## Review
- Confirm if hard delete is desired or soft delete (status=deleted). SPEC implies removal ("Delete a tool"). So hard delete is assumed.
