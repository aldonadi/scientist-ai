# Goal Schema

- **Status:** DONE
- **Points:** 2
- **Story ID:** 041
- **Type:** Feature

## Description
Define the schema structure for the `Goal` object. A Goal represents a termination condition for an experiment. When the goal's condition evaluates to true, the experiment ends successfully. Goals are embedded within `ExperimentPlan`.

## Technical Specification

### Schema Structure (Embedded Subdocument)
```javascript
{
  description: String,
  conditionScript: String
}
```

### Field Definitions
- **description**: `String` (Required). Human-readable description of the goal (e.g., "Profit exceeds $1000").
- **conditionScript**: `String` (Required). Python boolean expression or function that evaluates against the Environment.

### Example conditionScript
```python
# Simple expression
env.variables['money'] > 1000

# Function-style
def check(env):
    return env.variables.get('money', 0) > 1000
```

### Logical Methods (Service Layer)
- `evaluate(environment)`: Executes the conditionScript against the provided environment, returns Boolean.

## User Story
**As a** Developer,
**I want** a schema for Goal objects,
**So that** I can define experiment termination conditions.

## Acceptance Criteria
- [x] Goal subdocument schema defined in `backend/src/models/schemas/goal.schema.js`.
- [x] `description` field is defined as String and Required.
- [x] `conditionScript` field is defined as String and Required.
- [x] Schema is exported for embedding in `ExperimentPlan`.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/schemas/goal.schema.test.js`.
2. **Valid Goal**: Create Goal with description and conditionScript.
3. **Missing Description**: Verify validation error when description is missing.
4. **Missing Script**: Verify validation error when conditionScript is missing.

## Review Log
**1/4/2026** - Accepted by Product Owner
