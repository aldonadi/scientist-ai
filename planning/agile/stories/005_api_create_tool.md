# Implement Create Tool API

- **Status:** READY
- **Points:** 2
- **Story ID:** 005
- **Type:** Feature

## Description
Implement the POST /api/tools endpoint to create new tools.

## User Story
**As a** User,
**I want** to register a new Tool,
**So that** I can use it in experiments.

## Acceptance Criteria
- [ ] POST /api/tools accepts JSON body.
- [ ] Validates required fields.
- [ ] Saves to DB.
- [ ] Returns 201 Created and the created object.

## Testing
1. POST valid tool data.
2. POST invalid data (missing name).
3. Verify persistence in DB.

## Review
