# Implement SSE Streaming Endpoint (Story 055)

## Goal
Implement a Server-Sent Events (SSE) endpoint `GET /api/experiments/:id/stream` to allow the frontend to receive real-time updates of experiment progress (steps, logs, tool calls) without polling.

## Proposed Changes

### Backend

#### 1. [NEW] Orchestrator Registry
Create a singleton service to map active Experiment Ids to their running `ExperimentOrchestrator` instances. This allows the API controller to attach event listeners to running experiments.

- **File**: `backend/src/services/orchestrator-registry.service.js`
- **Responsibilities**:
    - `register(experimentId, orchestrator)`
    - `get(experimentId)`
    - `remove(experimentId)`

#### 2. [MODIFY] Experiment Controller
Update `experiment.controller.js` to:
1.  Register the orchestrator when launching or resuming an experiment.
2.  Unregister when the orchestrator finishes.
3.  Implement `streamExperimentEvents` to handle the SSE connection.

- **File**: `backend/src/controllers/experiment.controller.js`
- **Changes**:
    - Import `OrchestratorRegistry`.
    - Update `launchExperiment`: Register before start, remove in finally.
    - Update `controlExperiment`: Register on RESUME.
    - Add `streamExperimentEvents` function:
        - Set SSE headers (`Content-Type: text/event-stream`, etc).
        - Retrieve orchestrator from registry.
        - If found, subscribe to `EventBus` events and write to stream.
        - Handle client disconnect.
        - Send initial connection message.

#### 3. [MODIFY] Experiment Routes
Register the new endpoint.

- **File**: `backend/src/routes/experiment.routes.js`
- **Changes**:
    - Add `GET /:id/stream` -> `experimentController.streamExperimentEvents`

## Verification Plan

### Automated Tests
Create a new test file `backend/tests/sse.test.js` using Jest and Supertest.

**Test Cases**:
1.  **Stream Connection**: Verify endpoint returns 200 and correct headers.
2.  **Event Streaming**: Mock an active Orchestrator and emit events; verify they are received on the stream.
3.  **Experiment Not Found/Not Running**: Verify behavior when ID is valid but experiment is not active (Should close stream or return 404/specific event).
4.  **Client Disconnect**: Verify listeners are removed when client closes connection.

**Command**:
```bash
npm test backend/tests/sse.test.js
```

### Manual Verification
1.  Start the backend.
2.  Launch a dummy experiment (using an existing plan).
3.  Use `curl` to connect to the stream:
    ```bash
    curl -N http://localhost:3000/api/experiments/<experiment_id>/stream
    ```
4.  Verify events appear in the terminal as the experiment runs.
