# ExperimentPlan Schema

- **Status:** NOT READY
- **Points:** 3
- **Story ID:** 043
- **Type:** Feature

## Description
Define the Mongoose schema for the `ExperimentPlan` model. An ExperimentPlan is the top-level template that defines how an experiment should be conducted, composing all the component subdocuments (Environment, Roles, Goals, Scripts).

## Technical Specification

### MongoDB Collection
**Collection Name**: `ExperimentPlans`

### Schema Definition
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  initialEnvironment: {
    variables: Object,
    variableTypes: Object
  },
  roles: [{
    name: String,
    modelConfig: {
      provider: ObjectId,
      modelName: String,
      config: Object
    },
    systemPrompt: String,
    tools: [ObjectId],
    variableWhitelist: [String]
  }],
  goals: [{
    description: String,
    conditionScript: String
  }],
  scripts: [{
    hookType: String,
    code: String
  }],
  maxSteps: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Validated Fields
- **name**: `String` (Required). Unique name for the plan.
- **description**: `String`. Human-readable description.
- **initialEnvironment**: Embedded Environment schema.
- **roles**: Array of embedded Role schemas.
- **goals**: Array of embedded Goal schemas.
- **scripts**: Array of embedded Script schemas.
- **maxSteps**: `Number` (Required, Default: 100). Safety limit to prevent infinite loops.

### Schema Options
- **Timestamps**: Enabled (`createdAt`, `updatedAt`).

### Indexes
- **Unique Index**: `{ name: 1 }` - Plan names must be unique.

### Dependencies
This schema imports and embeds:
- Environment schema (story 037)
- Role schema (story 040, which includes ModelConfig from 039)
- Goal schema (story 041)
- Script schema (story 042)

## User Story
**As a** Developer,
**I want** a Mongoose model for ExperimentPlans,
**So that** I can store complete experiment templates with all their components.

## Acceptance Criteria
- [ ] Mongoose Schema created in `backend/src/models/experimentPlan.model.js`.
- [ ] `name` field is defined as String and Required.
- [ ] `description` field is defined as String.
- [ ] `initialEnvironment` embeds the Environment schema.
- [ ] `roles` field embeds array of Role schemas.
- [ ] `goals` field embeds array of Goal schemas.
- [ ] `scripts` field embeds array of Script schemas.
- [ ] `maxSteps` field is defined as Number with default value.
- [ ] Timestamps are enabled.
- [ ] Unique index on `name` field.
- [ ] Model is exported correctly.

## Testing
1. **Unit Test**: Create test file `backend/tests/models/experimentPlan.model.test.js`.
2. **Complete Plan**: Save a plan with all nested components populated.
3. **Minimal Plan**: Save a plan with only required fields (name, maxSteps).
4. **Nested Validation**: Verify that validation errors in nested schemas bubble up.
5. **Duplicate Name**: Verify duplicate key error on name collision.
6. **Role Tool References**: Verify ObjectId references to Tools are stored correctly.

## Review Log

