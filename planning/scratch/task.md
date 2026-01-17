# Story 061: Fix Plan Save & Add Dirty Check

## Task Breakdown

### Planning Phase
- [x] Create User Story 061
- [x] Register in Backlog
- [ ] Analyze Component & Service
- [ ] Update Implementation Plan

### Execution Phase
- [x] Fix Save Payload/Logic (Debug "Not Saving")
- [x] Implement Toast Notification Service/Component
- [x] Implement `CanDeactivate` Guard / Dirty Check Logic in Component

### Verification Phase
- [x] Verify Save persists data (Browser)
- [x] Verify Toast appears
- [x] Verify Dirty Guard prompts on navigation

# Story 062: Fix Experiment Controls & Improve Logging

## Task Breakdown

### Planning Phase
- [x] Create User Story 062
- [x] Register in Backlog
- [ ] Analyze Control Flow (Frontend -> API -> Orchestrator)
- [ ] Update Implementation Plan

### Execution Phase
- [x] Fix Frontend Control Bindings in `ExperimentMonitorComponent`
- [x] Verify Backend Control Endpoint (Added Case Normalization & Full Object Return)
- [x] Tune Log Verbosity in `ExperimentOrchestrator`
- [x] Enhance `LogFeedComponent` with collapsible data

### Verification Phase
- [x] Manual Test: Run Experiment, Pause, Resume, Stop.
- [x] Manual Test: Check Log Feed for clarity.

### Planning Phase
- [x] Create User Story 060
- [x] Register in Backlog
- [ ] Create Implementation Plan (Updated)

### Execution Phase
- [x] Backend: Add `testProviderModel` endpoint
- [x] Frontend: Update `ProviderService`
- [x] Frontend: Update `RolesTabComponent` (Sort, Rename, Test Button)
- [x] Frontend: Update `RolesTabTemplate`

### Verification Phase
- [x] Manual Verification (Browser Subagent)

### Planning Phase
- [x] Review story requirements and acceptance criteria
- [x] Survey existing experiment components and services
- [x] Review backend log schema
- [x] Create implementation plan

### Execution Phase
- [x] Enhance ExperimentMonitorComponent with full 3-panel layout
  - [x] Header with experiment status, name, step counter
  - [x] Controls (Pause/Resume/Stop) connected to service
- [x] Create LogFeedComponent
  - [x] Display log entries with timestamp, source, message
  - [x] Color-code by source type
  - [x] Auto-scroll to bottom
- [x] Create JsonTreeComponent for environment display
  - [x] Expandable/collapsible nodes
  - [x] Syntax highlighting
- [x] Integrate services to fetch real data
  - [x] Load experiment on init
  - [x] Load logs on init
  - [x] Poll for updates (SSE is Story 036)

### Verification Phase
- [x] Frontend build passes
- [x] Manual testing to Create Plan (Blocked by 400/500 errors - Resolved)
  - [x] Seed Default Provider (Ollama)
  - [x] Fix Backend Plan Schema Validation (Provider validation, script logic)
  - [x] Fix Frontend Plan Editor Payload Format (Env types, hook casing)
- [x] Verify Tab State Persistence (Roles, Scripts, Goals via [hidden] fix)
- [x] Fix Plan List UI Counts (Backend `listPlans` projection, Frontend `goalCount`)
- [x] Fix Input Focus Loss in Goals/Scripts (Added `trackBy`)
- [x] Fix Goal Evaluation Python Scope (`env` vs `env_obj`)
- [x] Fix Python `.get()` Support (Replaced `SimpleNamespace` with `DotDict`)
- [x] Fix Provider Type Resolution (Fetch Provider doc by ObjectId in `processRole`)
- [x] Fix Frontend Log Parsing (Map `{logs: []}` object to `Log[]` array)
- [x] Fix Role Persistence (Remove `.populate('roles.tools')` in `getPlan`)
- [x] Fix Resume Duplication (Check `OrchestratorRegistry` in `controlExperiment`)
- [x] Implement Inference Error Handling (Retry Logic)
    - [x] Add `maxStepRetries` to ExperimentPlan Schema
    - [x] Update `processRole` in Orchestrator to handle retries
- [x] Implement Model List API & UI
    - [x] Backend: `GET /api/providers/:id/models`
    - [x] Frontend: Model Dropdown and Connection Test Button
- [ ] Enhance Role Editor UI (User Feedback)
    - [ ] Rename 'Test' to 'Fetch Models'
    - [ ] Implement 'Test Model' Inference Button
        - [ ] Backend: `POST /api/providers/:id/test` (consume chat stream)
        - [ ] Frontend: Service method + UI Button + Status Display
    - [ ] Layout Tweaks (Manual Input positioning)
    - [ ] Sort Model List Alphabetically

## Acceptance Criteria (from Story)
- [x] Shows current status/step.
- [x] 3-panel layout (Logs, Activity, Environment).
- [x] Log feed component.
- [x] JSON tree view for environment.
