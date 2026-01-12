# SSE Streaming Endpoint Walkthrough

I have implemented the Server-Sent Events (SSE) streaming endpoint for the Scientist.ai platform. This allows the frontend to receive real-time updates of experiment execution, including new steps, log messages, and tool outputs.

## Changes

### 1. Orchestrator Registry
Created a new `OrchestratorRegistry` service to manage active `ExperimentOrchestrator` instances. This allows the API controller to look up the running orchestrator for a given experiment ID and attach event listeners.

- **File**: `backend/src/services/orchestrator-registry.service.js`

### 2. Experiment Controller Integration
Updated the `ExperimentController` to:
- Register the orchestrator with the registry when an experiment starts or resumes.
- Unregister when the experiment finishes.
- Implement the `GET /api/experiments/:id/stream` endpoint.

- **File**: `backend/src/controllers/experiment.controller.js`

### 3. API Route
Added the new route to the experiment router.

- **File**: `backend/src/routes/experiment.routes.js`

```javascript
// GET /api/experiments/:id/stream - Stream events
router.get('/:id/stream', experimentController.streamExperimentEvents);
```

### 4. Automated Tests
Added comprehensive unit tests using `supertest` and mocks to verify:
- Correct content type headers (`text/event-stream`).
- Connection events.
- Real-time event streaming from the orchestrator.
- Handling of completed/failed experiments.
- Proper cleanup on client disconnect.

- **File**: `backend/tests/sse.test.js`

## Verification Results

### Automated Tests
Run the following command to execute the tests:

```bash
npm test backend/tests/sse.test.js
```

**Output**:
```
PASS  tests/sse.test.js
  SSE Streaming Endpoint
    ✓ should return 400 for invalid ID format (90 ms)
    ✓ should return error event for non-existent experiment (47 ms)
    ✓ should stream events from an active orchestrator (540 ms)
    ✓ should write events to response (78 ms)
    ✓ should send END event for completed experiment (19 ms)
```

## Usage Example

To consume the stream from a client (e.g., using `curl` or browser `EventSource`):

```javascript
const eventSource = new EventSource('/api/experiments/<id>/stream');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

eventSource.addEventListener('STEP_START', (e) => {
    const data = JSON.parse(e.data);
    console.log('Step Started:', data.stepNumber);
});
```
