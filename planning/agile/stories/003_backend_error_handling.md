# Implement Global Error Handling

- **Status:** DONE
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
- [x] Middleware captures unhandled exceptions.
- [x] Standard JSON error format: `{ error: true, message: '...' }`.
- [x] HTTP Status codes are respected (400, 404, 500).
- [x] Automated testing suite tests for these codes and tests pass.

## Testing
1. Trigger a 404.
2. Trigger a 500 exception.
3. Verify JSON response format.

## Review Log

**1/3/26**: Added acceptance criteria for automated testing.

**1/3/26**: Accepted by Product Owner.
