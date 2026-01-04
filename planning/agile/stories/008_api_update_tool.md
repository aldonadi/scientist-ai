# Implement Update Tool API

- **Status:** READY
- **Points:** 2
- **Story ID:** 008
- **Type:** Feature

## Description
Implement the `PUT /api/tools/:id` endpoint to allow updating an existing tool's properties.

## User Story
**As a** User or System Orchestrator,
**I want** to edit the properties of a tool (such as code, description, or parameters),
**So that** I can fix bugs, improve functionality, or correct configuration errors.

## Acceptance Criteria

### API Endpoint
- **Method**: `PUT` (or `PATCH` semantics are acceptable, but we use `PUT` for this resource).
- **Path**: `/api/tools/:id`
- **Parameters**:
    - `id` (path): MongoDB ObjectId.
- **Request Body**: JSON object containing fields to update.
    - `name` (string, optional)
    - `namespace` (string, optional)
    - `description` (string, optional)
    - `code` (string, optional)
    - `parameters` (object, optional)

### Behavior
- [ ] Validates `id` format.
- [ ] Validates request body against the Tool schema checks (e.g. required fields if they were null, but here we are updating so just checking types).
- [ ] Checks for uniqueness: If `name` or `namespace` is being updated, ensure the new combination doesn't already exist.
- [ ] Updates the tool in the database.
- [ ] Updates `updatedAt` timestamp.
- [ ] Returns the updated tool object.
- [ ] Returns 400 Bad Request if validation fails or unique constraint violated.
- [ ] Returns 404 Not Found if tool does not exist.

### Response Codes
- **200 OK**: Update successful.
- **400 Bad Request**: Validation error (invalid ID, invalid payload, duplicate name).
- **404 Not Found**: Tool not found.
- **500 Internal Server Error**: Database error.

### Response Data Format
Returns the *updated* tool object.
```json
{
  "_id": "60d5ec...",
  "name": "new_name",
  "..."
}
```

## Technical Implementation Notes
- Use `Tool.findByIdAndUpdate(id, updates, { new: true, runValidators: true })`.
- Be careful with `runValidators: true` on updates to ensure schema rules are enforced.
- Handle MongoDB duplicate key error (code 11000) for name/namespace collision.

## Testing
### Automated Tests
- Create a test file `backend/tests/api/tool/update_tool.test.js`.
- **Test Cases**:
    1.  **Valid Update**: Create tool, update its description and code. Verify 200 and changes persisted.
    2.  **Duplicate Rename**: Create Tool A and Tool B. Try to rename Tool A to Tool B's name/namespace. Verify 400 (or 409 depending on implementation, but 400 is fine as per logic).
    3.  **Invalid ID**: Update `invalid-id`. Verify 400.
    4.  **Not Found**: Update `valid-but-missing-id`. Verify 404.

### Manual Verification
1.  Create a tool via POST (or manually seed).
2.  `curl -X PUT -H "Content-Type: application/json" -d '{"description": "updated"}' http://localhost:3000/api/tools/<id>`
3.  Verify response contains "updated".

## Review
- Ensure `updatedAt` is correctly modified.
