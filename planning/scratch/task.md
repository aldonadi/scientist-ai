# Story 038: Provider Schema Implementation

## Tasks

- [x] Create Provider Model
  - [x] Create `provider.model.js` with Mongoose schema
  - [x] Define provider types enum as single source of truth
  - [x] Add URL validation for `baseUrl` field
  - [x] Create unique index on `name` field
  - [x] Enable timestamps

- [x] Create Provider Zod Schema
  - [x] Create `provider.schema.js` with Zod validation
  - [x] Create schema for Provider creation
  - [x] Create schema for Provider updates

- [x] Create Provider Model Tests
  - [x] Test success case with all required fields
  - [x] Test validation error for missing required fields
  - [x] Test enum validation for invalid `type` values
  - [x] Test duplicate name error (requires DB)
  - [x] Test optional `apiKeyRef` field handling
  - [x] Test URL validation

- [x] Update story file and backlog
  - [x] Mark acceptance criteria checkboxes
  - [x] Update backlog status to REVIEW
