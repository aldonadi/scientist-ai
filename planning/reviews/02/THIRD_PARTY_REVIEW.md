# Prompt

(to Claude Opus 4.5)

> Review `SPEC.md`, user story `027_tool_execution_logic.md`, previous chat context, and review the relevant files in the codebase, from the perspective of an incredibly anal, detail-oriented, nuclear software design engineer critical analyst. Your job is to assess the experiment loop step implementation for its completeness, software safety (bugs or design flaws), testing code coverage, and overall architecture and design. Your are not paid to be friendly, positive, or a teller of good news. Your job is to tell us plainly the flaws that we are blind to because of our tunnel vision being this close to the code. Be brutal: not for its own sake but because this is a safety-critical part of the code and failure or design flaws are not an option.

# Output

## Critical Review: Orchestrator Step Loop Implementation

### 1. Architectural & Design Flaws

#### 1.1 Missing Script Registration (SPEC Non-Compliance)
**SPEC Section 12.2, Phase 1, Point 3**: "Script Registration: The engine loads all Scripts defined in the plan and registers them as listeners on the EventBus."

**Current Implementation**: Zero code for this. Scripts defined in `ExperimentPlan.scripts` are never loaded, never registered.

**Impact**: All lifecycle hooks (`STEP_START`, `EXPERIMENT_START`, etc.) specified in the plan are completely dead. The entire hook system specified in the architecture is non-functional.

---

#### 1.2 No `PAUSED` State Handling
**SPEC Section**: Experiment model defines `PAUSED` as a valid status.

**Current Implementation**: The loop condition `while (this.experiment.status === 'RUNNING')` will exit if status changes to `PAUSED`, but:
1.  There is no mechanism to pause from outside the loop.
2.  There is no resume mechanism.
3.  External status changes (e.g., via API `POST /experiments/:id/control`) would cause the loop to silently exit without proper termination handling.

**Impact**: Race conditions. If an external actor sets status to `PAUSED`, the loop exits without emitting `EXPERIMENT_END`. The experiment is left in a limbo state.

---

#### 1.3 No Cleanup Phase (SPEC Non-Compliance)
**SPEC Section 12.2, Phase 3, Point 3**: "Cleanup: Close database connections (if dedicated), clean up any temp files."

**Current Implementation**: None. The orchestrator simply returns. No cleanup, no resource release.

**Impact**: Resource leaks. If anything creates temp files or holds connections, they are orphaned.

---

#### 1.4 Missing `environmentSnapshot` in `STEP_END` Event
**SPEC EventTypes, event-bus.js Line 15**: `STEP_END: 'STEP_END', // { stepNumber, environmentSnapshot }`

**Current Implementation (Line 149-152)**:
```javascript
this.eventBus.emit(EventTypes.STEP_END, {
    experimentId: this.experiment._id,
    stepNumber: step
});
```
No `environmentSnapshot`. This breaks subscribers expecting snapshot data.

---

#### 1.5 Missing `duration` in `EXPERIMENT_END` Event
**SPEC EventTypes**: `EXPERIMENT_END: { result, duration }`

**Current Implementation** (Lines 98-101, 112-115): No `duration`. The `startTime` and `endTime` are set, but never calculated or emitted.

---

### 2. Software Safety & Bug Analysis

#### 2.1 [evaluateGoals()](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js:167:4-191:5) is Fundamentally Broken
**Line 180-186**:
```javascript
const condition = goal.conditionScript;
if (condition.trim() === 'TRUE') {
    return goal.description;
}
```

This is not evaluation. This is string matching on a magic constant. The SPEC mandates Python script execution in a container.

**Impact**: In production, **no goal will ever be detected as met** unless someone literally writes `"TRUE"` as the condition. Every experiment will run to `maxSteps` and fail.

**Security Note**: Even if you attempted [eval()](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js:167:4-191:5) here as a shortcut, that would be a severe security vulnerability. The placeholder is correct in spirit (defer to Story 028), but the story file for 025 claims "*Evaluates all Goals after step completion*" as an acceptance criterion, which is **incorrectly marked as complete**.

---

#### 2.2 Error Swallowing in [evaluateGoals()](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js:167:4-191:5)
**Lines 187-189**:
```javascript
} catch (e) {
    console.error(`Goal evaluation failed for goal ${goal.description}`, e);
}
```

Errors are logged and then **silently ignored**. The loop continues. If goal evaluation fails due to a bug or bad data, the experiment continues running indefinitely until `maxSteps`.

**Impact**: Silent failures. No visibility. No event emitted for this failure mode.

---

#### 2.3 Silent Exit on Status Change (Race Condition)
**Lines 84-86**:
```javascript
while (
    this.experiment.status === 'RUNNING' &&
    ...
```

If an external process modifies the experiment status in the database and the orchestrator re-reads it (which it doesn't, actually—it only reads `this.experiment.status` from in-memory), the loop would exit. But more critically, **the orchestrator never re-syncs with the database**. The status in `this.experiment` is stale after any external mutation.

**Impact**: If someone implements the control API (`PAUSE`/`STOP`), it won't work because the orchestrator ignores external changes.

---

#### 2.4 TODO Left in Production Path
**Line 127**: `// TODO: Emit ERROR event?`

This is not acceptable for a safety-critical component. Error events **must** be emitted for observability.

---

### 3. Testing Coverage Analysis

#### 3.1 Missing Test: Script Registration
No test verifies that scripts are registered on the event bus. This is because the feature doesn't exist.

#### 3.2 Missing Test: Pause/Resume
No test for pause/resume behavior. Again, feature doesn't exist.

#### 3.3 Missing Test: Goal Evaluation with Real Logic
The test uses the magic `"TRUE"` string:
```javascript
{ description: 'Goal B', conditionScript: 'TRUE' }
```
This tests the workaround, not actual goal evaluation. When Story 028 is implemented, these tests must be updated. The current "passing" test creates false confidence.

#### 3.4 Missing Test: Concurrent Status Change
No test for what happens if `experiment.status` is changed mid-loop by an external actor.

#### 3.5 Missing Test: `save()` Failure
Every `await this.experiment.save()` is unchecked. What if the database is down? The mock returns `true`, but no test verifies behavior on save failure.

#### 3.6 Missing Test: Role Processing Failure
[processRole()](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js:154:4-165:5) can throw. If it throws, the whole step fails. There's a test for [processStep](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js:132:4-152:5) throwing, but not for individual role failures. The current implementation doesn't distinguish between "step failed" and "role failed"—both result in experiment failure.

#### 3.7 Missing Test: Empty Roles Array
What if `plan.roles` is empty? The loop runs but does nothing. This should probably emit a warning. Untested edge case.

#### 3.8 Missing Test: Zero `maxSteps`
What if `maxSteps` is 0? The loop condition `currentStep < maxSteps` is `0 < 0 = false`. The loop never runs. Is this intended? Untested.

#### 3.9 Missing Test: Event Listener Throws
If an event listener throws during [emit()](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/event-bus.js:28:4-36:5), what happens? The current [EventBus](cci:2://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/event-bus.js:23:0-37:1) extends `EventEmitter` and inherits its default behavior (which would crash the process in Node if `'error'` event is emitted without handler). No test for this.

---

### 4. Code Quality Issues

#### 4.1 Console Logging in Production Code
- **Line 122**: `console.error('Error in execution loop:', error);`
- **Line 188**: `console.error(...)`

The system has a Logger service. Use it. Console logging bypasses the observability architecture.

#### 4.2 Magic Number `0`
**Line 44**: `Object.keys(this.experiment.currentEnvironment.variables).length === 0`

This check is fragile. An environment with an empty `variables` object is not the same as "no environment set". What if someone intentionally wants an empty initial environment?

#### 4.3 Mongoose Document Mutation
The code directly mutates `this.experiment.status`, `this.experiment.result`, etc. This works with Mongoose, but mixes state management with persistence. Consider separating these concerns.

---

### 5. SPEC Compliance Summary

| Requirement | Status |
|-------------|--------|
| Emit `EXPERIMENT_START` | ✓ Implemented |
| Script Registration | ✗ Missing |
| Emit `STEP_START` | ✓ Implemented |
| Role Iteration | ✓ Structure exists (placeholder) |
| Deep Copy + Whitelist Filter | ✗ Not in scope (Story 026) |
| Emit `MODEL_PROMPT` | ✗ Not in scope (Story 026) |
| Tool Execution | ✗ Not in scope (Story 027) |
| Emit `STEP_END` with snapshot | ✗ Missing snapshot |
| Goal Evaluation (Python) | ✗ Non-functional placeholder |
| Increment Step | ✓ Implemented |
| Max Steps Check | ✓ Implemented |
| Emit `EXPERIMENT_END` with duration | ✗ Missing duration |
| Cleanup Phase | ✗ Missing |
| Pause/Resume | ✗ Missing |
| Error Event | ✗ TODO comment |

---

### 6. Immediate Action Items

1.  **Critical**: Do not mark Story 025's acceptance criteria "*Evaluates all Goals after step completion*" as complete. It is not functional.
2.  **High**: Add `environmentSnapshot` to `STEP_END` event.
3.  **High**: Add `duration` to `EXPERIMENT_END` event.
4.  **High**: Emit an error event when the loop fails.
5.  **Medium**: Add script registration in [initialize()](cci:1://file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js:23:4-39:5).
6.  **Medium**: Replace `console.error` with Logger service.
7.  **Low**: Add tests for edge cases listed above.

