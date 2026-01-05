# Walkthrough - Role, Goal, and Script Schemas

I have implemented the Mongoose schemas for `Role`, `Goal`, and `Script` as embedded subdocuments, along with their unit tests.

## Changes

### Role Schema
- Defined `RoleSchema` in `backend/src/models/schemas/role.schema.js` with fields: `name`, `modelConfig`, `systemPrompt`, `tools`, `variableWhitelist`.
- Created unit tests in `backend/tests/models/schemas/role.schema.test.js`.

### Goal Schema
- Defined `GoalSchema` in `backend/src/models/schemas/goal.schema.js` with fields: `description`, `conditionScript`.
- Created unit tests in `backend/tests/models/schemas/goal.schema.test.js`.

### Script Schema
- Defined `ScriptSchema` in `backend/src/models/schemas/script.schema.js` with fields: `hookType`, `code`.
- Created unit tests in `backend/tests/models/schemas/script.schema.test.js`.

## Verification Results

### Automated Tests
Role Schema Tests:
```
PASS  tests/models/schemas/role.schema.test.js
  Role Schema
    ✓ should validate a valid role (19 ms)
    ✓ should require a name (7 ms)
    ✓ should require modelConfig (5 ms)
    ✓ should allow empty tools and whitelist (7 ms)
```

Goal Schema Tests:
```
PASS  tests/models/schemas/goal.schema.test.js
  Goal Schema
    ✓ should validate a valid goal (16 ms)
    ✓ should require description (4 ms)
    ✓ should require conditionScript (3 ms)
```

Script Schema Tests:
```
PASS  tests/models/schemas/script.schema.test.js
  Script Schema
    ✓ should validate a valid script (18 ms)
    ✓ should fail on invalid hookType (4 ms)
    ✓ should require code (4 ms)
```
