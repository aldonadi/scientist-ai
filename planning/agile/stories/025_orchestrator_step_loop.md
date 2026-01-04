# Implement Experiment Step Loop

- **Status:** NOT READY
- **Points:** 8
- **Story ID:** 025
- **Type:** Feature

## Description
Implement the main loop of the orchestrator: Step Start -> Role Iteration -> Goal Check -> Step End.

## User Story
**As a** User,
**I want** the experiment to proceed in steps,
**So that** agents can interact sequentially.

## Acceptance Criteria
- [ ] Loop increments `currentStep`.
- [ ] Respects `maxSteps`.
- [ ] Calls `processStep()` repeatedly.

## Testing
1. Run a dummy loop with 0 roles.
2. Verify step counter increments.

## Review Log
