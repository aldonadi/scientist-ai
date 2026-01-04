# Implement Global Error Handling

- **Status:** READY
- **Points:** 2
- **Story ID:** 003
- **Type:** Feature

## Description
Implement a centralized error handling middleware for the Express application to ensure consistent API error responses.

## User Story
**As a** API Consumer,
**I want** consistent error messages,
**So that** I can handle failures gracefully.

## Acceptance Criteria
- [ ] Middleware captures unhandled exceptions.
- [ ] Standard JSON error format: `{ error: true, message: '...' }`.
- [ ] HTTP Status codes are respected (400, 404, 500).

## Testing
1. Trigger a 404.
2. Trigger a 500 exception.
3. Verify JSON response format.

## Review
