# Implement Create Plan API

- **Status:** NOT READY
- **Points:** 2
- **Story ID:** 011
- **Type:** Feature

## Description
Implement the `POST /api/plans` endpoint to allow users to save new Experiment Plans. This endpoint will accept a JSON payload corresponding to the `ExperimentPlan` schema, validate the structure and references, and persist it to the MongoDB `ExperimentPlans` collection.

## User Story
**As a** Scientist (User),
**I want** to save my experiment design (Plan),
**So that** I can run multiple experiments based on that design later without re-entering configuration.

## Request Specification
**Endpoint**: `POST /api/plans`
**Content-Type**: `application/json`

### Request Body Schema
The body must strictly conform to the `ExperimentPlan` structure.

```json
{
  "name": "Stock Trader V1",
  "description": "A simple agent that buys/sells based on random sentiment.",
  "maxSteps": 50,
  "initialEnvironment": {
    "variables": {
      "money": 1000,
      "marketStatus": "OPEN"
    },
    "variableTypes": {
      "money": "float",
      "marketStatus": "string"
    }
  },
  "roles": [
    {
      "name": "Trader",
      "systemPrompt": "You are a stock trader...",
      "modelConfig": {
        "provider": "60d5ecb8b487343510e12345", // ObjectId of the Provider
        "modelName": "llama3",
        "config": { "temperature": 0.7 }
      },
      "tools": [
        "60d5ecb8b487343510e67890" // ObjectId of a Tool
      ],
      "variableWhitelist": ["money", "marketStatus"]
    }
  ],
  "goals": [
    {
      "description": "Make 20% profit",
      "conditionScript": "env.money > 1200"
    }
  ],
  "scripts": [
    {
      "hook": "STEP_START",
      "code": "print('Step starting')"
    }
  ]
}
```

## Response Specification

### Success (201 Created)
Returns the created plan document.
```json
{
  "_id": "60d5ecb8b487343510eabcde",
  "name": "Stock Trader V1",
  ... // Full plan object
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

### Errors
- **400 Bad Request**:
  - Missing required fields (`name`, `maxSteps`, `roles`, etc.).
  - Duplicate `name` (Plan names must be unique).
  - Invalid ObjectIds for `provider` or `tools`.
  - Malformed schema (e.g., `initialEnvironment` not matching structure).
- **404 Not Found**:
  - Referenced `Provider` ID does not exist.
  - Referenced `Tool` IDs do not exist.
- **500 Internal Server Error**: Database failures.

## Acceptance Criteria
- [x] **Schema Validation**: The endpoint validates strict Types (String, Number, etc.) and required fields.
- [x] **Reference Validation**: The backend explicitly verifies that the `modelConfig.provider` ID exists in the `Providers` collection and all `tools` IDs exist in the `Tools` collection. If any are missing, return 400/404 with a descriptive error message indicating which ID is invalid.
- [x] **Uniqueness**: Enforce unique `name` for plans.
- [x] **Persistence**: Valid plans are saved to the `ExperimentPlans` collection.
- [x] **No Orphans**: It should not create "partial" plans if validation fails.

## Testing Rules
- **Unit Tests**:
  - Mock `ExperimentPlan.save` to succeed and fail.
  - Test validation logic for valid/invalid inputs.
- **Integration Tests**:
  - Use `mongodb-memory-server`.
  - Create a dummy `Provider` and `Tool` first.
  - Attempt to create a Plan referencing them (Success).
  - Attempt to create a Plan referencing non-existent IDs (Fail).
  - Attempt to create a Plan with duplicate name (Fail).

## Implementation Details
- Rely on Mongoose `ExperimentPlan` model for basic type checking.
- Add manual lookups for `Provider` and `Tool` existence check before saving, or handle the error gracefully if Mongoose throws a `ValidatorError` (though explicit checks are better for error messages).

## Review Log
- Updated story with full JSON spec and validation rules.
