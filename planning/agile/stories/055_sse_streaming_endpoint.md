# Implement SSE Streaming Endpoint

- **Status:** READY
- **Points:** 5
- **Story ID:** 055
- **Type:** Feature

## Description
Implement Server-Sent Events (SSE) endpoint for real-time experiment updates. This allows the frontend to receive live updates without polling.

- `GET /api/experiments/:id/stream` - SSE stream of experiment events

### Review Finding Reference
- **Source**: Third-Party Review 1 (H1), Third-Party Review 2 (Section 1)
- **Severity**: MEDIUM
- **Impact**: No real-time UI updates; frontend must poll

## User Story
**As a** User,
**I want** to receive real-time updates about my running experiment,
**So that** I can monitor progress without refreshing.

## Acceptance Criteria
- [ ] `GET /api/experiments/:id/stream` endpoint implemented
- [ ] Returns SSE stream (`Content-Type: text/event-stream`)
- [ ] Streams STEP_START, STEP_END, MODEL_RESPONSE_CHUNK events
- [ ] Streams TOOL_CALL, TOOL_RESULT events
- [ ] Streams EXPERIMENT_END event and closes connection
- [ ] Returns 404 if experiment doesn't exist
- [ ] Handles client disconnect gracefully
- [ ] Connection timeout for ended experiments

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/sse.test.js`
- **Cases**:
    - Stream opens for running experiment
    - Events are formatted correctly
    - Stream closes on EXPERIMENT_END
    - Returns 404 for missing experiment

### Integration Tests
- Manual test with browser/curl to verify SSE format

## Technical Notes
- Use Express response with appropriate SSE headers
- Subscribe to EventBus for the specific experimentId
- Format: `event: eventType\ndata: {payload}\n\n`
- Consider using a library like `express-sse` or implement manually
- Handle cleanup on client disconnect (req.on('close', ...))

## Review
