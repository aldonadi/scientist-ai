# Chat History Implementation Walkthrough

I have implemented per-role chat history persistence to enable context-aware interactions with the Ollama provider.

## Changes

### 1. Database Schema
Modified `Experiment` model to include `roleHistory`:
```javascript
roleHistory: {
    type: Map,
    of: [
        {
            role: { type: String, enum: ['system', 'user', 'assistant', 'tool'] },
            content: String,
            tool_calls: Schema.Types.Mixed,
            timestamp: { type: Date, default: Date.now }
        }
    ]
}
```

### 2. Orchestrator Logic
Updated `ExperimentOrchestrator.processRole()` to:
- **Load History**: Prepend existing `roleHistory` (excluding System prompt) to the current prompt.
- **Pass Copy**: Send a shallow copy of messages to `ProviderService` to avoid mutation side-effects.
- **Persist History**: After each turn, append the new interactions (User -> Assistant -> Tool -> Assistant) to the `roleHistory` and save to MongoDB.

## Verification Results

### Automated Tests
Created `backend/tests/services/experiment-orchestrator.history.test.js`.
- **Pass**: `should initialize history and send correct prompt on first turn`
- **Pass**: `should include previous history in prompt for subsequent steps` (Verifies context retention)
- **Pass**: `should persist tool calls correctly in history` (Verifies complex tool interaction persistence)

### Manual Verification
The implementation ensures that as the experiment progresses, the `User` prompt for Step N includes the full conversation history from Step 1 to N-1, allowing the model to reference past actions.
