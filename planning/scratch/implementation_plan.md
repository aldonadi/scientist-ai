# Implementation Plan - Per-Role Chat History

This plan outlines the changes required to persist chat history for each Role in an experiment and leverage it for context-aware interactions with the Ollama provider.

## Goal Description
Currently, the Experiment Orchestrator constructs a fresh prompt for each step, isolating the context. Code investigation reveals that the Ollama API is stateless and requires the full `messages` array to be sent with each request to maintain context.
To enable "memory" for Roles across steps (or even just robust debugging), we must persist the chat history (User <-> Assistant <-> Tool) for each Role and resend it during inference.

## User Review Required
> [!IMPORTANT]
> **Context Window Limits**: Validating "entire history" indefinitely will eventually exceed the context window of local models (e.g., 4k or 8k tokens).
> **Recommendation**: We should implement a basic sliding window or "max messages" limit in the future. For this initial implementation, we will append history indefinitely until a failure occurs, or add a simple cap (e.g., last 50 messages).

## Proposed Changes

### Backend

#### [MODIFY] [experiment.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/experiment.model.js)
- Update `ExperimentSchema` to include a `roleHistory` field.
- **Structure**:
  ```javascript
  roleHistory: {
      type: Map,
      of: [
          {
              role: { type: String, enum: ['system', 'user', 'assistant', 'tool'] },
              content: String,
              tool_calls: Schema.Types.Mixed, // Optional
              images: [String], // Optional
              timestamp: { type: Date, default: Date.now }
          }
      ],
      default: {}
  }
  ```

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- **Method `initializing()`**:
    - Allow pre-seeding history if needed (optional).
- **Method `processRole()`**:
    - **Load**: Retrieve `this.experiment.roleHistory.get(role.name)` or initialize `[]`.
    - **Prompt Construction**:
        - Instead of resetting `messages` to just `[System, User]`, append the new `User` message (with environment state) to the *existing* history.
        - *Note*: usage of `systemPrompt` should probably be "sticky" (always first) or reiterated. Ollama often handles system prompts as a specific field or the first message.
        - **Strategy**: Keep `System` prompt as index 0. Append previous history (excluding old system prompts if any). Append new `User` message.
    - **Inference**: Pass the full accumulated history to `ProviderService.chat`.
    - **Save**:
        - Append the `User` prompt to `roleHistory`.
        - Append the `Assistant` response (and tool calls) to `roleHistory`.
        - Append `Tool` results to `roleHistory`.
        - Persist changes to DB: `this.experiment.markModified('roleHistory'); await this.experiment.save();`.

## Verification Plan

### Automated Tests
- **New Test**: `backend/tests/services/experiment-orchestrator.history.test.js`
    - **Scenario**: Run a mock experiment with 2 steps.
    - **Verify**:
        - Step 1 history is saved.
        - Step 2 prompt includes Step 1's history.
        - Database contains the full conversation structure in `roleHistory`.

### Manual Verification
- **Inspection**:
    1. Run a simple experiment (e.g., "Hello World" or a math sequence).
    2. Check MongoDB directly or add a temporary log to print the `messages` array sent to Ollama.
    3. Verify that the second step's prompt allows the model to "remember" the first step's output (e.g., "What number did I just say?").
