# Task List

- [x] Research existing codebase <!-- id: 0 -->
    - [x] `backend/src/models/experimentPlan.model.js` <!-- id: 1 -->
    - [x] `backend/src/services/experiment-orchestrator.service.js` <!-- id: 2 -->
    - [x] `frontend/src/app/features/plans/plan-editor/` <!-- id: 3 -->
- [x] Create Implementation Plan <!-- id: 4 -->
- [x] Backend Implementation <!-- id: 5 -->
    - [x] Update `ExperimentPlan` schema for Role Env Vars <!-- id: 6 -->
    - [x] Update `ExperimentPlan` schema/Tool logic for `endsTurn` <!-- id: 7 -->
    - [x] Update `ExperimentOrchestrator` to inject Role specific Env Vars <!-- id: 8 -->
    - [x] Update `ExperimentOrchestrator` to handle non-turn-ending tools <!-- id: 9 -->
    - [x] Update `ExperimentOrchestrator` to pass tool name to hooks <!-- id: 10 -->
- [x] Frontend Implementation <!-- id: 11 -->
    - [x] Update Role configuration UI to select Env Vars <!-- id: 12 -->
    - [x] Update Tool configuration UI to toggle `endsTurn` <!-- id: 13 -->
- [x] Verification <!-- id: 14 -->
    - [x] Verify Role Env Vars injection <!-- id: 15 -->
    - [x] Verify `endsTurn` behavior <!-- id: 16 -->
    - [x] Verify Hook context <!-- id: 17 -->

## Environment Data Types Support
- [ ] Research existing Environment implementation <!-- id: 18 -->
- [ ] Create Implementation Plan for Data Types <!-- id: 19 -->
- [x] Backend Changes <!-- id: 20 -->
    - [x] Update `environment.schema.js` to support Array/Object types explicitly if needed <!-- id: 21 -->
    - [x] Verify `ExperimentOrchestrator` handles complex types (JSON serialization should handle it) <!-- id: 22 -->
- [x] Frontend Changes <!-- id: 23 -->
    - [x] Update `EnvironmentTabComponent` to support adding Array/Object types <!-- id: 24 -->
    - [x] Implement JSON editor or dynamic field inputs for complex types <!-- id: 25 -->
- [x] Verification <!-- id: 26 -->
    - [x] Verify saving/loading Plans with complex env vars <!-- id: 27 -->
    - [x] Verify Python tools receive correct JSON structures <!-- id: 28 -->
