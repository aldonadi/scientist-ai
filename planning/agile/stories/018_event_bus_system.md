# Implement Internal Event Bus

- **Status:** DONE
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
- [x] Supports `emit` and `on`.
- [x] Defines string constants for all event types (STEP_START, LOG, etc).

## Testing
1. Unit test: Create bus, subscribe, emit, verify callback.

## Review Log
**1/6/2026** - Accepted by Product Owner