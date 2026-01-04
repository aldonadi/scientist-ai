# Implement Internal Event Bus

- **Status:** NOT READY
- **Points:** 3
- **Story ID:** 018
- **Type:** Feature

## Description
Create the `EventBus` class extending Node.js EventEmitter, with typed events.

## User Story
**As a** Developer,
**I want** a central event bus,
**So that** I can decouple execution logic from side effects.

## Acceptance Criteria
- [ ] Supports `emit` and `on`.
- [ ] Defines string constants for all event types (STEP_START, LOG, etc).

## Testing
1. Unit test: Create bus, subscribe, emit, verify callback.

## Review Log
