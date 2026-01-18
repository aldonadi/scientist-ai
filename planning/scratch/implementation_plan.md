# Environment Data Types Support

The user wants to add support for `lists/arrays` and `dicts/associative arrays` to the Experiment Environment.
Currently, the backend schema uses `Schema.Types.Mixed`, so it technically supports any JSON structure.
The frontend `EnvironmentTabComponent` already has options for `array` and `object` in the dropdown, and `parseValue` logic handles JSON parsing.

However, we need to verify:
1.  **Backend Validation**: `backend/src/models/schemas/environment.schema.js` has a `validateType` function. It currently checks `typeValidators[typeStr]`. We need to ensure `array` and `object` are supported validators.
2.  **Frontend Usability**: Ensure the existing `array`/`object` integration works as expected. The user explicitly asked for "lists/arrays and dicts/associative arrays", so we should double-check the naming and functionality. "Object" corresponds to Dicts/Associative Arrays. "Array" corresponds to Lists.

## Proposed Changes

### Backend
#### [MODIFY] [environment.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/environment.schema.js)
- Add validators for `array` and `object` to `typeValidators`.
  - `array`: `Array.isArray(value)`
  - `object`: `typeof value === 'object' && value !== null && !Array.isArray(value)`

### Frontend
#### [MODIFY] [environment-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/environment-tab.component.ts)
- It seems the frontend ALREADY has support:
  - Detects `array` and `object`.
  - Has placeholder text.
  - Has `parseValue` logic using `JSON.parse`.
- **Action**: I will verify if any changes are actually needed. It looks like the component might already be "feature complete" but perhaps the *backend* was rejecting it due to missing validators.
- I will rename "Object" to "Dictionary/Object" and "Array" to "List/Array" in the UI to match user terminology.
- I will ensure validation logic in frontend uses the new terminology if necessary, or just keeps internal types 'array'/'object'.

## Verification Plan

### Automated Tests
- Create a test ensuring complex types can be saved and retrieved from the backend.
- Create a test verifying the validators work.

### Manual Verification
- Create a Plan with an Array `["a", "b"]` and Object `{"x": 1}`.
- Save it.
- Run it.
- Verify in Python tool that `env['my_array']` is a list and `env['my_dict']` is a dict.
