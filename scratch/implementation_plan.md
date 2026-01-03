# Refine SPEC.md based on User Feedback

## Goal Description
Address the `TODO` items added by the user in `SPEC.md` and ensure the new Domain Objects (`Provider`, `ModelConfig`, `Logger`) are fully integrated into the specification, including the Class Diagram and API definitions.

## User Review Required
None.

## Proposed Changes

### Documentation
#### [MODIFY] [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/SPEC.md)

1.  **Domain Objects**:
    *   **Provider**: Define members (`name`, `type` [Ollama, OpenAI], `baseUrl`, `apiKey`) and methods (`listModels()`).
    *   **ModelConfig**: Define `chat()` input (messages history, tools definitions) and output (stream).
    *   **Role**: Clarify access to streaming tokens (likely via an event emitter on the `Experiment` execution or a callback).
    *   **Script**: Define the specific Hook Types in a list.

2.  **API**:
    *   **Tools**: Specify `?namespace=value` query parameter for filtering.
    *   **Plans**: Specify `POST /duplicate` body schema `{ name: "New Name" }`.

3.  **Class Diagram**:
    *   Add `Provider` and `ModelConfig` classes.
    *   Add `Logger` and `LogEntry` classes.
    *   Connect `Experiment` to `Logger`.

## Verification Plan
### Manual Verification
- Review the updated `SPEC.md` to ensure all `TODO` comments are removed and replaced with concrete specifications.
- Verify the Mermaid diagram renders correctly (I will verify the syntax).
