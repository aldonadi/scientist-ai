# Walkthrough - Fix BlackJack Experiment Backward Crash

I have investigated and fixed the issue where the BlackJack experiment caused the backend to become unresponsive and crash. The root cause was an unhandled promise rejection in the hook system when Docker execution failed.

## The Issue

The user reported that the model appeared to "do nothing" and the experiment would fail or behave erratically. My investigation revealed:
1.  The experiment uses lifecycle hooks (e.g., `STEP_START` or `BEFORE_TOOL_CALL`) that require Docker execution.
2.  The Docker daemon was inaccessible (`connect EACCES /var/run/docker.sock`).
3.  The `EventBus` emitted events synchronously (`emit`), meaning proper `async` execution of the hooks was not awaited.
4.  When the hook failed (due to Docker), the `async` handler threw an error in the background.
5.  This error was NOT caught by the Orchestrator's main loop try/catch block because the promise was floating.
6.  Node.js detected an "Unhandled Promise Rejection" and crashed the backend process.

## The Fix

I refactored the Event System to support fully synchronous/blocking asynchronous event propagation:

1.  **Modified `EventBus` (`backend/src/services/event-bus.js`)**:
    - Added `emitAsync(type, payload)` method which returns a `Promise.all` of all listener results.

2.  **Updated `ExperimentOrchestrator` (`backend/src/services/experiment-orchestrator.service.js`)**:
    - Replaced `this.eventBus.emit` with `await this.eventBus.emitAsync` for all critical lifecycle events (e.g., `EXPERIMENT_START`, `STEP_START`, `TOOL_CALL`, etc.).
    - This ensures that if a Hook fails, the error propagates immediately to the Orchestrator's execution loop.
    - The Orchestrator's existing `try/catch` block now correctly catches the error, logs it, and marks the experiment as `FAILED` without crashing the server.

## Verification

I verified the fix using the Browser Subagent:
1.  Restarted the backend with the fix.
2.  Started a new **BlackJack** experiment.
3.  Observed that the experiment **did not crash the backend**.
4.  The experiment Status correctly updated to **FAILED**.
5.  The Error message `Error: connect EACCES /var/run/docker.sock` was clearly displayed in the logs/UI.

## Remaining Environment Issue

The experiment now fails gracefully, but it still fails because the `scientist-ai` backend user (`andrew`) does not have permission to access the Docker socket. As configured in `SPEC.md` and Story 021, the system requires Docker.

**Recommended User Action:**
Run the following commands to fix the Docker permission issue on the host machine:
```bash
sudo usermod -aG docker $USER
newgrp docker
```
(Or log out and log back in).
