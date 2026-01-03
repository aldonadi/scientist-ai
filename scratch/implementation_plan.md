# Refine SPEC.md: Execution Engine & Step Lifecycle

## Goal Description
Detailed specification of the Experiment Execution Engine, including a rigorous step-by-step flowchart and logic description, as requested by the user.

## User Review Required
None.

## Proposed Changes

### Documentation
#### [MODIFY] [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/SPEC.md)

1.  **New Section 12: Execution Engine & Step Lifecycle**:
    *   **Overview**: Describe the Node.js Orchestrator's role.
    *   **Lifecycle Phases**:
        1.  **Initialization**: Plan -> Experiment instantiation.
        2.  **The Step Loop**: Detailed breakdown of a single step.
        3.  **Termination**: Goal checks and cleanup.
    *   **Mermaid Flowchart**: A visual representation of the loop, including Hooks (`StartStep`, `BeforeTool`, etc.).

2.  **Logic Details**:
    *   Explicitly define how `Role` turns work (sequential).
    *   Define how `Tool` output is fed back to the model (Re-prompting with tool outputs).
    *   Define `Goal` evaluation timing (End of step? or after every Role action?). *Decision: End of step for stability, unless a "Sudden Death" goal is needed. SPEC will say End of Step for now.*

## Verification Plan
### Manual Verification
- Review the Mermaid diagram for logical correctness against `CONCEPT.md`.
- Ensure all hooks from the Domain Object section are placed in the flowchart.
