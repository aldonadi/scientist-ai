# Input Validation & Sanitization (Story 058)

Implement unobtrusive but intuitive input validation for fields that require it, enforcing validation in both frontend (with red-highlighting and messages) and backend (with schema validation).

## User Review Required

> [!IMPORTANT]
> **Python Code Validation Scope**: Story 058 requires validating Goal condition expressions and Script code by "running them in a Python container." This requires calling a backend validation endpoint. Should we:
> 1. **Create a new `/api/validate/python` endpoint** - Executes Python code in a sandboxed container and returns syntax/runtime errors
> 2. **Client-side syntax check only** - Use a regex or basic parser to check Python syntax client-side (no security guarantee, but faster)
> 3. **Defer Python validation to save time** - Just check that code is not empty, validate fully on experiment launch

> [!NOTE]
> The frontend currently uses `ngModel` template-driven forms. Adding validation will require visual error states and error messages. This approach integrates naturally with the existing patterns.

---

## Proposed Changes

### Frontend Validation Utilities

#### [NEW] [validation.utils.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/utils/validation.utils.ts)

Create a new validation utilities file with reusable validation functions:
- `isValidPythonIdentifier(name: string): boolean` - Validates Python function/variable names
- `isValidJson(json: string): {valid: boolean, error?: string}` - JSON schema validation
- `isPositiveInteger(value: any): boolean` - Integer > 0 validation
- `getValidationError(control: string, value: any): string | null` - Centralized error message generator

---

### Tool Editor Validation

#### [MODIFY] [tool-editor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/tools/tool-editor.component.ts)

- Add validation state tracking: `nameError`, `namespaceError`, `parametersError`, `codeError`
- Add real-time validation on `(ngModelChange)` for name fields
- Add visual error indicators (red borders, error messages) for:
  - **Name**: Must be valid Python function name (regex: `^[a-zA-Z_][a-zA-Z0-9_]*$`)
  - **Namespace**: Must be valid Python identifier
  - **Parameters**: Must be valid JSON (already partially implemented)
- Disable "Save" button when validation errors exist
- Add error messages below invalid fields

---

### Plan Editor General Tab Validation

#### [MODIFY] [general-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/general-tab.component.ts)

- Add validation for `maxSteps`:
  - Must be a positive integer > 0
  - Add `@Output() isValidChange = new EventEmitter<boolean>()`
- Add visual error indicator when `maxSteps` is invalid
- Emit validation state to parent `plan-editor.component.ts`

---

### Plan Editor Environment Tab Validation

#### [MODIFY] [environment-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/environment-tab.component.ts)

- Add validation per-row for:
  - **Variable Key**: Must be valid Python identifier (regex: `^[a-zA-Z_][a-zA-Z0-9_]*$`)
  - **Variable Value**: Must be parseable as the selected type
- Track errors per variable: `variableErrors: { [key: number]: string }`
- Add `@Output() isValidChange = new EventEmitter<boolean>()`
- Red highlight on invalid fields
- Show inline error messages

---

### Plan Editor Goals Tab Validation

#### [MODIFY] [goals-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/goals-tab.component.ts)

First, need to view this file to understand its current structure.

- Add validation for Goal condition expressions:
  - Non-empty check
  - Basic Python syntax check (check for unmatched brackets, common errors)
  - (Optional, based on user decision) Backend validation endpoint call
- Track errors per goal
- Red highlight on invalid conditions

---

### Plan Editor Scripts Tab Validation

#### [MODIFY] [scripts-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts)

First, need to view this file to understand its current structure.

- Add validation for Script code:
  - Non-empty check
  - Basic Python syntax check
  - (Optional, based on user decision) Backend validation endpoint call
- Track errors per script
- Red highlight on invalid code fields

---

### Backend Validation Endpoint (Optional - depends on user decision)

#### [NEW] [validation.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/validation.routes.js)

If server-side Python validation is desired:
```javascript
// POST /api/validate/python
// Body: { code: string, env?: object }
// Response: { valid: boolean, error?: string }
```

#### [NEW] [validation.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/validation.controller.js)

Controller to execute Python code in a sandboxed container with timeout.

---

## Verification Plan

### Automated Tests

#### Backend Tests
**Command**: `cd backend && npm test`

Existing tests in `backend/tests/api/tool/` verify API behavior. New functionality to test:
- If Python validation endpoint is added: Write tests in `backend/tests/api/validation.test.js`
- Test valid/invalid Python code returns appropriate responses
- Test timeout handling for malicious code

#### Frontend Tests  
**Command**: `cd frontend && npm test`

The project uses Jasmine+Karma for Angular testing. Currently only `app.component.spec.ts` exists.
- Add unit tests for `validation.utils.ts` functions
- Tests should verify Python identifier regex works correctly

### Manual Verification

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Tool Editor, enter `123tool` as name | Red border appears, error message: "Must start with a letter" |
| 2 | Enter `my-tool` as name | Red border, error message: "Only letters, numbers, and underscores allowed" |
| 3 | Enter `my_tool` as name | Green/normal border, no error |
| 4 | Enter `{invalid json` in parameters | Red border, "Invalid JSON" error |
| 5 | Try to save with errors | Save button disabled or shows warning |
| 6 | Open Plan Editor General tab, set maxSteps to 0 | Red border, error message |
| 7 | Set maxSteps to -5 | Red border, error message |
| 8 | Set maxSteps to 10 | No error |
| 9 | Open Environment tab, add variable with key `123var` | Red border on key field |
| 10 | Add variable with key `my_var`, type Number, value "abc" | Red border on value field |
| 11 | Fix value to "100" | Error clears |

