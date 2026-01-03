# Refine SPEC.md: Logging Integration

## Goal Description
Integrate comprehensive logging into the Experiment Lifecycle and Step Loop. Define how generic `Logger` instances are passed to Scripts and Tools to maintain separation of concerns.

## User Review Required
None.

## Proposed Changes

### Documentation
#### [MODIFY] [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/SPEC.md)

1.  **Domain Objects Updates**:
    *   **Script**: Explicitly define `ScriptContext` which is passed to `run()`. `ScriptContext` includes `environment` and `logger`.
    *   **Tool**: Update `execute` signature to include `logger` (or `ToolContext`).

2.  **Execution Engine (Section 12) Updates**:
    *   **Initialization**: Log "Experiment Initialized", "Scripts Loaded".
    *   **Step Loop**:
        *   Log "Step N Started".
        *   Log Environment State Snapshot at the end of the step.
    *   **Goal Evaluation**: Log "Goal Met: [Description]" upon success.
    *   **Script/Tool Execution**: Mention that the Engine passes a scoped Logger (e.g. `logger.cloneWithSource('ScriptName')`) to the executable.

## Verification Plan
### Manual Verification
- Review `SPEC.md` to ensure every phase of the lifecycle has a corresponding logging action.
- Verify that `ScriptContext` is clearly defined.
