# Environment Schema Implementation

Define the Environment embedded subdocument schema with utility functions for managing experiment state with type-safe variable access.

## Proposed Changes

### Environment Schema

#### [NEW] [environment.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/environment.schema.js)

Create a new Mongoose schema for the Environment subdocument:

**Schema Fields:**
- `variables`: `Schema.Types.Mixed` - Key-value pairs holding state values
- `variableTypes`: `Schema.Types.Mixed` - Type definitions map

**Utility Functions (exported alongside schema):**
- `deepCopy(env)`: Returns a new object with detached state (deep clone)
- `get(env, key)`: Retrieves a variable value from the environment
- `set(env, key, value)`: Modifies a variable with type validation based on `variableTypes`
- `toJSON(env)`: Serializes environment for API transmission

**Type Validation Logic for `set()`:**
| Type | Validation |
|------|------------|
| `string` | `typeof value === 'string'` |
| `int` | `Number.isInteger(value)` |
| `float` | `typeof value === 'number'` |
| `bool` | `typeof value === 'boolean'` |
| `enum:[A,B,C]` | Value exists in parsed enum array |

---

### Tests

#### [NEW] [environment.schema.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/models/schemas/environment.schema.test.js)

Comprehensive test suite covering:

1. **Schema Structure Tests**
   - Schema exports correctly
   - Mixed type fields accept any JSON values

2. **Deep Copy Tests**
   - Mutations to copy don't affect original
   - Nested objects are fully detached

3. **Type Enforcement Tests**
   - Valid string assignment
   - Invalid string assignment (rejects numbers)
   - Valid int assignment  
   - Invalid int assignment (rejects floats)
   - Valid float assignment (accepts both int and float)
   - Valid bool assignment
   - Invalid bool assignment
   - Valid enum assignment
   - Invalid enum assignment (value not in list)
   - Unknown variable key handling

4. **Edge Cases**
   - Empty environment
   - Null/undefined values
   - Missing variableTypes entry (allows any type)

## Verification Plan

### Automated Tests

Run the Jest test suite to verify all functionality:

```bash
cd /home/andrew/Projects/Code/web/scientist-ai/backend && npm test -- tests/models/schemas/environment.schema.test.js
```

All tests must pass with 100% coverage of the utility functions.

### Full Test Suite

Ensure no regressions in existing tests:

```bash
cd /home/andrew/Projects/Code/web/scientist-ai/backend && npm test
```
