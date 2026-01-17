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

## Verification Plan

### Automated Tests
- **Unit Tests**: Test `ExperimentOrchestrator` retry logic with mock Provider failing N times.
- **Integration Tests**: Verify `GET /models` returns list from mock/real Ollama.

### Manual Verification
- **Retry**: Configure a plan with a non-existent model (fails 404). Run experiment. Verify it retries 3 times then fails.
- **Model List**: Open Plan Editor -> Roles. Select Ollama Provider. Verify Dropdown populates. Click "Test Connection".
