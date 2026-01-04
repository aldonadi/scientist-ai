# Implement Create Tool API

- **Status:** DONE
- **Points:** 2
- **Story ID:** 005
- **Type:** Feature

## Description
Implement the `POST /api/tools` endpoint to allow the registration of new tools in the system. This endpoint must validate the input against the Tool schema defined in `SPEC.md` and persist the tool to the MongoDB `Tools` collection.

### Request Body Fields
| Field | Type | Required | Description | Validation Rules |
|---|---|---|---|---|
| `namespace` | String | Yes | Grouping identifier (e.g., 'system', 'custom') | Non-empty, alphanumeric/underscore. |
| `name` | String | Yes | Unique identifier within namespace | Non-empty, alphanumeric/underscore. Combined with `namespace`, must be unique. |
| `description` | String | Yes | Natural language description for LLM consumption | Non-empty. |
| `parameters` | Object | Yes | JSON Schema defining accepted arguments | Must be a valid JSON Schema object. |
| `code` | String | Yes | Python source code implementation | Non-empty string. |

### Response
- **Success:** `201 Created` with the created Tool object (including `_id`, `createdAt`, `updatedAt`).
- **Failure:**
    - `400 Bad Request`: Validation failure (missing fields, invalid format, invalid JSON schema).
    - `409 Conflict`: Tool with same `namespace` and `name` already exists.
    - `500 Internal Server Error`: Database or system error.

## User Story
**As a** User (or Admin),
**I want** to register a new Tool via the API,
**So that** I can extend the capabilities of the agentic system with custom Python scripts.

## Acceptance Criteria
- [x] Endpoint `POST /api/tools` is implemented.
- [x] Request body is validated using a schema validator (e.g., Joi/Zod) matching the fields above.
- [x] Uniqueness check: Implementation prevents duplicate `namespace` + `name` pairs.
- [x] Successfully saves the new Tool document to the MongoDB `Tools` collection.
- [x] Returns correct HTTP status codes (`201`, `400`, `409`, `500`).
- [x] All inputs are sanitized to prevent injection (though execution is sandboxed, storage should be clean).

## Testing
This story requires **Automated Unit Tests** (e.g., Jest + Supertest).

### Automated Tests
1. **Happy Path:** POST a valid tool payload. Assert response is `201` and body contains expected fields (including generated `_id`). Verify persistence by querying DB.
2. **Validation Error (Missing Field):** POST payload missing `name`. Assert `400` validation error.
3. **Validation Error (Invalid Param Schema):** POST payload with malformed `parameters` (not valid JSON schema). Assert `400`.
4. **Duplicate Error:** POST the same valid tool payload twice. The second request should fail with `409 Conflict`.
5. **Sanitization:** POST fields with potential script injection chars. Verify they are handled safely (stored as string definition, not executed).

## Review Log
- Ensure the `Tool` Mongoose model matches the schema in `SPEC.md`.
- Confirm that the `parameters` field is strictly validated as a JSON Schema object to prevent runtime errors in the LLM.
