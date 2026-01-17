# Implementation Plan - Reliability & Model Management

## Goal Description
Enhance experiment stability by implementing configurable retries for inference steps and improve the user experience by allowing model selection from a provider-sourced list.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Adding `maxStepRetries` to `ExperimentPlan`. Defaults to 3. Existing plans will need a migration or default value.
> **API Change**: New endpoint `GET /api/providers/:id/models`.

## Proposed Changes

### Backend

#### [MODIFY] [experimentPlan.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/experimentPlan.model.js)
- Add `maxStepRetries` (Number, default: 3) to schema.

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- In `processRole`: Wrap the Inference/Tool Loop in a `try/catch` block with a retry counter.
- If error occurs:
    - Log error.
    - Increment retry count.
    - If `retryCount < maxStepRetries`, continue (retry).
    - Else, throw Error (halts experiment).

#### [MODIFY] [provider.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/provider.service.js)
- Add `listModels(providerConfig)` method.
- Update `OllamaStrategy` and `OpenAIStrategy` to implement `listModels`.

#### [MODIFY] [provider.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/provider.controller.js)
- Add `getProviderModels(req, res)` method.
- Route: `GET /:id/models`.

#### [MODIFY] [provider.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/provider.routes.js)
- Register new route.

### Frontend

#### [MODIFY] [plan.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/plan.service.ts)
- Update `ExperimentPlan` interface to include `maxStepRetries`.

#### [MODIFY] [provider.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/provider.service.ts)
- Add `getProviderModels(id: string): Observable<string[]>` method.

#### [MODIFY] [roles-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/tabs/roles-tab/roles-tab.component.ts)
- In `editRole`, load models for the selected provider.
- Replace Model Input Reference with a `<select>` or Combobox.
- Add "Test Connection" button next to Model Select. (Calls `getProviderModels` and shows success/fail).

#### [MODIFY] [roles-tab.component.html](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/tabs/roles-tab/roles-tab.component.html)
- Update UI template.

### Role Editor UI Enhancements (Story 060)
#### [MODIFY] [provider.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/provider.controller.js)
- Add `testProviderModel` to handle single-shot inference tests.
#### [MODIFY] [roles-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/roles-tab.component.ts)
- Sort model list.
- Rename 'Test' -> 'Fetch Models'.
- Add 'Test Model' button and logic.

### Fix Plan Save & Add Dirty Check (Story 061)
#### [NEW] [toast.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/toast.service.ts)
- Create simple Toast service (success/error/info).
#### [NEW] [toast.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/shared/components/toast/toast.component.ts)
- Create Toast overlay component.
#### [MODIFY] [app.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/app.component.ts)
- Embed `<app-toast>` in main layout.
#### [NEW] [unsaved-changes.guard.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/guards/unsaved-changes.guard.ts)
- Create `CanDeactivate` guard interface.
#### [MODIFY] [plan-editor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/plan-editor.component.ts)
- Implement `CanDeactivate` interface (compare `initialPlan` vs `currentPlan`).
- Integrate `ToastService` for save feedback.
- Debug payload construction (log payload before save).
#### [MODIFY] [app.routes.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/app.routes.ts)
- Apply guard to plan editor routes.

## Story 062: Fix Experiment Controls & Improve Logging

### Backend
#### [MODIFY] [experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)
- Verify/Implement `controlExperiment` method (pause/resume/stop).
- Ensure it updates the Experiment document status correctly.
- Ensure it handles invalid transitions (e.g. Resume from STOPPED).

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- **Log Noise**: Modify `executeHook` to log less verbose output.
    - Instead of logging full `stdout` in the message, put it in `data` only.
    - Change message to "Hook X Executed".
- **Log Visibility**: Ensure Model Thoughts/Tool Calls are logged clearly (they seem to be, but verify).

### Frontend
#### [MODIFY] [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts)
- Verify `control` method functionality (done, seems correct).
- (Optional) Improve `LogFeedComponent` to hide/collapse verbose data.

#### [MODIFY] [log-feed.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/log-feed.component.ts)
- Update to render logs more cleanly (maybe hide `data` object by default).

## Verification Plan

### Automated Tests
- **Unit Tests**: Test `ExperimentOrchestrator` retry logic with mock Provider failing N times.
- **Integration Tests**: Verify `GET /models` returns list from mock/real Ollama.

### Manual Verification
- **Retry**: Configure a plan with a non-existent model (fails 404). Run experiment. Verify it retries 3 times then fails.
- **Model List**: Open Plan Editor -> Roles. Select Ollama Provider. Verify Dropdown populates. Click "Test Connection".
- **Manual**: Run an experiment (e.g. BlackJack).
- **Manual**: Click Pause. Verify Status changes to PAUSED. Verify Orchestrator stops logging steps.
- **Manual**: Click Resume. Verify it continues.
- **Manual**: Click Stop. Verify it stops.
- **Manual**: Check Logs. Hooks should be less spammy.
