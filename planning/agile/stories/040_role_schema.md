# Role Schema

- **Status:** DONE
- **Points:** 3
- **Story ID:** 040
- **Type:** Feature

## Description
Define the schema structure for the `Role` object. A Role defines an Agent's identity and capabilities within an experiment, including its model configuration, system prompt, available tools, and which environment variables it can access. Roles are embedded within `ExperimentPlan`.

## Technical Specification

### Schema Structure (Embedded Subdocument)
```javascript
{
  name: String,
  modelConfig: {
    provider: ObjectId,    // Reference to Provider
    modelName: String,
    config: Object
  },
  systemPrompt: String,
  tools: [ObjectId],           // References to Tool collection
  variableWhitelist: [String]  // Environment variable keys this Role can see
}
```

### Field Definitions
- **name**: `String` (Required). The role's identifier (e.g., "Trader", "Analyst").
- **modelConfig**: `Object` (Required). Embedded ModelConfig subdocument.
- **systemPrompt**: `String`. The system message that defines the agent's personality and instructions.
- **tools**: `[ObjectId]`. Array of references to the `Tools` collection.
- **variableWhitelist**: `[String]`. Array of variable keys from the Environment that this Role is allowed to see.

### Logical Methods (Service Layer)
- `constructPrompt(environment)`: Builds the context window by filtering the environment based on `variableWhitelist` and combining with `systemPrompt`.

## User Story
**As a** Developer,
**I want** a schema for Role objects,
**So that** I can define agent identities with specific model configurations and capabilities.

## Acceptance Criteria
- [x] Role subdocument schema defined in `backend/src/models/schemas/role.schema.js`.
- [x] `name` field is defined as String and Required.
- [x] `modelConfig` embeds the ModelConfig schema.
- [x] `systemPrompt` field is defined as String.
- [x] `tools` field is defined as array of ObjectId references to `Tool`.
- [x] `variableWhitelist` field is defined as array of Strings.
- [x] Schema is exported for embedding in `ExperimentPlan`.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/schemas/role.schema.test.js`.
2. **Valid Role**: Create Role with all fields populated.
3. **Missing Name**: Verify validation error when name is missing.
4. **Tool References**: Verify ObjectId references are stored correctly.
5. **Whitelist**: Test with various whitelist configurations.

## Review Log
**1/4/2026** - Accepted by Product Owner
