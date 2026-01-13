# Input Validation & Sanitization

- **Status:** READY
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
- [ ] **Tool Names**: Must be valid Python function names:
    - Start with a letter.
    - Include only letters, numbers, and underscores.
- [ ] **Tool Parameter Schema**: Must be valid JSON.
    - Preferably auto-generated/parsed from the Python code.
- [ ] **ExperimentPlan Safety Limits**: Must be an integer greater than 0.
- [ ] **ExperimentPlan Environment Variables**:
    - Names must be valid Python variable names (start with letter, only letters/numbers/underscores).
    - Initial values must be compatible with the variable type.
- [ ] **Goal Condition Expression**: Must be valid Python code.
    - Verified by trying to run it in a python container with a default environment.
- [ ] **Script Code**: Must be valid Python code.
    - Validated by attempting to "compile" or execute in a Python container.
    - Provided with a default environment and dummy arguments during validation.
    - Must not allow invalid code to save/proceed.

## Testing
1. Try entering invalid tool names (e.g., "123tool", "my-tool") and verify error.
2. Enter invalid JSON in parameter schema and verify error.
3. Enter negative numbers for safety limits and verify error.
4. Enter invalid env var names and mismatching types/values.
5. Enter broken Python code in Goal Conditions and Scripts and verify validation failure.
