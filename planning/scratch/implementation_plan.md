# Implementation Plan - Event Bus System

## Goal Description
Implement the internal Event Bus system to decouple the execution engine from side effects like logging and UI updates. This involves creating a standard `EventBus` class extending Node.js `EventEmitter` and defining standard event types.

## Proposed Changes

### Backend

#### [NEW] [event-bus.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/event-bus.js)
- Create `EventBus` class extending `EventEmitter`.
- Define `EventTypes` constants as specified in SPEC.
- Export `EventBus` class and `EventTypes`.

## Verification Plan

### Automated Tests
- Create a new test file `backend/tests/services/event-bus.test.js`.
- Test cases:
    - Verify `EventBus` can be instantiated.
    - Verify `emit` triggers `on` callbacks.
    - Verify all required event types are defined.
- Run tests using:
    ```bash
    npm test tests/services/event-bus.test.js
    ```
