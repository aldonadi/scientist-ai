# Implement Update Tool API (Story 008)

Implement `PUT /api/tools/:id` endpoint to update existing tools with validation, duplicate name detection, and comprehensive test coverage.

## Proposed Changes

### Backend Controller
#### [MODIFY] [tool.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/tool.controller.js)

Add `updateTool` function with:
- ObjectId format validation (reuse pattern from `getTool`)
- Partial Zod schema (`toolSchema.partial()`) for optional fields
- Duplicate name/namespace check when updating either field
- Use `Tool.findByIdAndUpdate(id, updates, { new: true, runValidators: true })`
- Handle MongoDB error code 11000 for duplicate key violations
- Return 200 with updated tool on success
- Return 400 for validation/duplicate errors, 404 for not found

---

### Backend Routes
#### [MODIFY] [tool.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/tool.routes.js)

Add route: `router.put('/:id', toolController.updateTool);`

---

### Testing
#### [NEW] [update_tool.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/api/tool/update_tool.test.js)

Comprehensive test suite covering:

| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid update (description + code) | 200, changes persisted | |
| Valid update (name only) | 200, name changed | |
| Valid update (namespace only) | 200, namespace changed | |
| Valid update (parameters) | 200, parameters changed | |
| Duplicate rename collision | 400 error | |
| Invalid ID format | 400 error | |
| Non-existent ID | 404 error | |
| Empty update body | 200 (no changes) | |
| Partial update preserves other fields | 200, other fields unchanged | |
| updatedAt timestamp changes | timestamp differs | |
| Unicode in description | 200, preserved | |
| Multiline code | 200, preserved | |
| Complex parameters schema | 200, preserved | |

## Verification Plan

### Automated Tests

Run all backend tests:
```bash
cd /home/andrew/Projects/Code/web/scientist-ai/backend && npm test
```

Run only update_tool tests:
```bash
cd /home/andrew/Projects/Code/web/scientist-ai/backend && npm test -- update_tool.test.js
```

### Manual Verification

1. Start backend server: `cd backend && npm run dev`
2. Create a tool:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"name":"test_update","namespace":"test","description":"original","code":"print(1)","parameters":{}}' \
     http://localhost:3000/api/tools
   ```
3. Copy the `_id` from response
4. Update the tool:
   ```bash
   curl -X PUT -H "Content-Type: application/json" \
     -d '{"description":"updated description"}' \
     http://localhost:3000/api/tools/<id>
   ```
5. Verify response shows updated description and changed `updatedAt`
