# Task List

- [ ] Research existing codebase <!-- id: 0 -->
    - [ ] `backend/src/models/experimentPlan.model.js` <!-- id: 1 -->
    - [ ] `backend/src/services/experiment-orchestrator.service.js` <!-- id: 2 -->
    - [ ] `frontend/src/app/features/plans/plan-editor/` <!-- id: 3 -->
- [ ] Create Implementation Plan <!-- id: 4 -->
- [ ] Backend Implementation <!-- id: 5 -->
    - [/] Update `ExperimentPlan` schema for Role Env Vars <!-- id: 6 -->
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
