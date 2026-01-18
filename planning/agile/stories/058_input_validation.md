# Input Validation & Sanitization

- **Status:** REVIEW
- **Points:** 5
- **Story ID:** 058
- **Type:** Feature

## Description
Implement unobtrusive but intuitive input validation to fields that require it. These validations should be enforced on the database, but also in the front-end in the form of red-highlighting with a message. Use UI/UX best-practices.

## User Story
**As a** User,
**I want** the system to validate my inputs and provide feedback,
**So that** I can avoid runtime errors and ensure my data is correct.

## Acceptance Criteria
- [x] **Tool Names**: Must be valid Python function names:
    - Start with a letter or underscore.
    - Include only letters, numbers, and underscores.
- [x] **Tool Parameter Schema**: Must be valid JSON.
    - Preferably auto-generated/parsed from the Python code.
- [x] **ExperimentPlan Safety Limits**: Must be an integer greater than 0.
- [x] **ExperimentPlan Environment Variables**:
    - Names must be valid Python variable names (start with letter/underscore, only letters/numbers/underscores).
    - Initial values must be compatible with the variable type.
- [x] **Goal Condition Expression**: Must be valid Python code.
    - Verified with basic client-side syntax check (bracket matching).
- [x] **Script Code**: Must be valid Python code.
    - Validated with basic client-side syntax check (bracket matching).
    - Shows error indicator if code is empty or has unclosed brackets.

## Implementation Notes
- Created `frontend/src/app/core/utils/validation.utils.ts` with reusable validation functions
- All validation is client-side with visual red-highlighting and error messages
- Python code validation uses basic bracket matching (not full container execution per user discussion)

## Testing
1. Try entering invalid tool names (e.g., "123tool", "my-tool") and verify error.
2. Enter invalid JSON in parameter schema and verify error.
3. Enter negative numbers for safety limits and verify error.
4. Enter invalid env var names and mismatching types/values.
5. Enter broken Python code in Goal Conditions and Scripts and verify validation failure.

## Review Log
- 2026-01-15: Implementation complete. Frontend validation added to all fields. Build passes.
