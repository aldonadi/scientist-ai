# Create Tool Mongoose Model

- **Status:** READY
- **Points:** 1
- **Story ID:** 004
- **Type:** Feature

## Description
Define the Mongoose schema for 'Tools', including fields for namespace, name, description, parameters, and code.

## User Story
**As a** Developer,
**I want** a database model for Tools,
**So that** I can save tool definitions.

## Acceptance Criteria
- [ ] Schema includes: namespace, name, description, parameters, code.
- [ ] Unique index on `{ namespace: 1, name: 1 }`.
- [ ] Timestamps (createdAt, updatedAt) enabled.

## Testing
1. Create a valid Tool document in mongo shell or test script.
2. Attempt to create a duplicate Tool (expect error).

## Review
