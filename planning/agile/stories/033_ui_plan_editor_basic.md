# Implement Plan Basic Settings UI

- **Status:** NOT READY
- **Points:** 3
- **Story ID:** 033
- **Type:** Feature

## Description
Create the form for editing basic Plan metadata and Initial Environment.

## User Story
**As a** User,
**I want** to edit plan details,
**So that** I can configure the starting state.

## Acceptance Criteria
- [ ] General Info Tab (Name, Desc, MaxSteps).
- [ ] Environment Tab (Variables Table).
- [ ] Roles Tab (List of Roles).
- [ ] Workflow Tab (Goals, Hooks).
- [ ] **Feature**: Switching tabs preserves unsaved state (e.g. adding a variable in Env, then switching to Roles shouldn't wipe data).
- [ ] Save button persists all tabs at once.

## Testing
1. Enter data in General.
2. Switch to Environment, add variable.
3. Switch back to General. Verify data remains.
4. Save. Verify database. plan.

## Review Log
