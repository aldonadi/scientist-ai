# Story 038: Provider Schema Implementation

## Tasks

- [/] Create Provider Model
  - [/] Create `provider.model.js` with Mongoose schema
  - [ ] Define provider types enum as single source of truth
  - [ ] Add URL validation for `baseUrl` field
  - [ ] Create unique index on `name` field
  - [ ] Enable timestamps

- [ ] Create Provider Zod Schema
  - [ ] Create `provider.schema.js` with Zod validation
  - [ ] Create schema for Provider creation
  - [ ] Create schema for Provider updates

- [ ] Create Provider Model Tests
  - [ ] Test success case with all required fields
  - [ ] Test validation error for missing required fields
  - [ ] Test enum validation for invalid `type` values
  - [ ] Test duplicate name error (requires DB)
  - [ ] Test optional `apiKeyRef` field handling
  - [ ] Test URL validation

- [ ] Update story file and backlog
  - [ ] Mark acceptance criteria checkboxes
  - [ ] Update backlog status
