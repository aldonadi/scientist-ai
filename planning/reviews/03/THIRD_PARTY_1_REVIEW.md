# Third-Party Safety Inspection Report
## Scientist.ai Backend Codebase Evaluation

**Inspector**: Independent Software Safety Inspector  
**Experience**: 20 years in military nuclear reactor control software  
**Review Date**: 2026-01-11  
**Spec Reference**: [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/planning/SPEC.md)  
**Inspection Scope**: Backend API completeness, Execution Engine correctness, Container security, Test coverage

---

## Executive Summary

| Category | Status | Grade |
|----------|--------|-------|
| Tool API (CRUD) | ✅ Complete | A |
| Plan API (CRUD) | ✅ Complete | A |
| Experiment Launch API | ⚠️ Partial | C |
| Experiment Control API | ✅ Complete | A |
| Experiment Read/Delete API | ❌ Missing | F |
| Logs API | ❌ Missing | F |
| SSE Streaming | ❌ Missing | F |
| Orchestrator Step Loop | ⚠️ Functional with issues | B- |
| Goal Evaluation | ✅ Complete | A |
| Container Execution | ⚠️ Security concerns | C |
| Test Coverage | ✅ Comprehensive | A |

**Overall Assessment**: **CONDITIONAL PASS** - Core CRUD operations are solid, orchestrator fundamentals work, but critical API endpoints are missing and security hardening is incomplete.

---

## Section 1: API Completeness Analysis

### 1.1 Tool API (CRUD) ✅ PASS

| Endpoint | SPEC Reference | Status | Notes |
|----------|----------------|--------|-------|
| `GET /api/tools` | §5 Line 465 | ✅ Implemented | Supports `?namespace=` filter |
| `GET /api/tools/:id` | §5 Line 467 | ✅ Implemented | Proper 404 handling |
| `POST /api/tools` | §5 Line 468 | ✅ Implemented | Duplicate detection, Zod validation |
| `PUT /api/tools/:id` | §5 Line 469 | ✅ Implemented | Conflict detection on rename |
| `DELETE /api/tools/:id` | §5 Line 470 | ✅ Implemented | Logging on deletion |

**Files Reviewed**:
- [tool.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/tool.controller.js)
- [tool.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/tool.routes.js)
- [tool.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/tool.model.js)

**Positive Findings**:
- Proper ObjectId validation before DB operations
- Safe tool name regex: `/^[a-zA-Z0-9_]+$/` prevents injection in Python execution
- Compound unique index on `(namespace, name)` enforced at DB level
- Destructive operations logged to console

---

### 1.2 Model and Role (via ExperimentPlan) ✅ PASS

Models and Roles are embedded in ExperimentPlan per SPEC design. Provider is a top-level entity.

| Component | Status | Location |
|-----------|--------|----------|
| Provider Model | ✅ Complete | [provider.model.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/provider.model.js) |
| ModelConfig Schema | ✅ Complete | [modelConfig.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/modelConfig.schema.js) |
| Role Schema | ✅ Complete | [role.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/role.schema.js) |

**Observations**:
- Provider types correctly enumerated: `OLLAMA`, `OPENAI`, `ANTHROPIC`, `GENERIC_OPENAI`
- URL validation regex prevents malformed baseUrl
- Role correctly references ModelConfig and Tool array
- `variableWhitelist` implemented per SPEC

---

### 1.3 Goal API (via ExperimentPlan) ✅ PASS

| Component | Status | Notes |
|-----------|--------|-------|
| GoalSchema | ✅ Complete | [goal.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/goal.schema.js) |
| Goal evaluation | ✅ Complete | [experiment-orchestrator.service.js:477-556](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js#L477-L556) |

---

### 1.4 Script API (via ExperimentPlan) ✅ PASS

| Component | Status | Notes |
|-----------|--------|-------|
| ScriptSchema | ✅ Complete | [script.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/script.schema.js) |
| Hook registration | ✅ Complete | Lines 58-67 of orchestrator |
| BEFORE/AFTER_TOOL_CALL | ✅ Added | Beyond original SPEC |

**Note**: `failPolicy` enum correctly implements `ABORT_EXPERIMENT` and `CONTINUE_WITH_ERROR`.

---

### 1.5 ExperimentPlan API (CRUD) ✅ PASS

| Endpoint | SPEC Reference | Status |
|----------|----------------|--------|
| `GET /api/plans` | §5 Line 474 | ✅ Implemented |
| `GET /api/plans/:id` | §5 Line 475 | ✅ Implemented with population |
| `POST /api/plans` | §5 Line 476 | ✅ Implemented with reference validation |
| `PUT /api/plans/:id` | §5 Line 477 | ✅ Implemented |
| `DELETE /api/plans/:id` | §5 Line 478 | ✅ Implemented with referential integrity check |
| `POST /api/plans/:id/duplicate` | §5 Line 479 | ❌ **NOT IMPLEMENTED** |

> [!WARNING]
> **Missing Feature**: The `POST /api/plans/:id/duplicate` endpoint specified in SPEC §5 Line 479 is not implemented.

**Files Reviewed**:
- [plan.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/plan.controller.js)
- [plan.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/plan.routes.js)

**Positive Findings**:
- Reference validation checks Provider and Tool existence before save
- Delete operation blocked if Experiment references the Plan (409 Conflict)
- Unique name constraint enforced

---

### 1.6 Experiment API ❌ CRITICAL GAPS

| Endpoint | SPEC Reference | Status | Severity |
|----------|----------------|--------|----------|
| `POST /api/experiments` | §5 Line 484 | ✅ Implemented | - |
| `GET /api/experiments` | §5 Line 486 | ❌ **MISSING** | HIGH |
| `GET /api/experiments/:id` | §5 Line 487 | ❌ **MISSING** | HIGH |
| `POST /api/experiments/:id/control` | §5 Line 488 | ✅ Implemented | - |
| `DELETE /api/experiments/:id` | Requirement k | ❌ **MISSING** | HIGH |
| `GET /api/experiments/:id/logs` | §5 Line 490 | ❌ **MISSING** | HIGH |
| `GET /api/experiments/:id/stream` | §5 Line 491 | ❌ **MISSING** | MEDIUM |

> [!CAUTION]
> **Critical Missing Endpoints**: Per user requirement items (h), (i), (j), and (k), the following capabilities are **NOT AVAILABLE**:
> - **Cannot observe experiment status** (`GET /api/experiments/:id`)
> - **Cannot list experiments** (`GET /api/experiments`)
> - **Cannot view environment state history** (no step-by-step snapshots API)
> - **Cannot delete ended experiments** (`DELETE /api/experiments/:id`)
> - **Cannot view logs** (`GET /api/experiments/:id/logs`)
> - **Cannot receive real-time updates** (SSE stream missing)

**Current Implementation** ([experiment.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/experiment.controller.js)):
```javascript
// Only two endpoints exist:
router.post('/', experimentController.launchExperiment);
router.post('/:id/control', experimentController.controlExperiment);
```

---

## Section 2: Experiment Step Subsystem Evaluation

### 2.1 Orchestrator Initialization ✅ PASS

**File**: [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)

| Phase | Status | Lines |
|-------|--------|-------|
| Experiment fetch | ✅ | 32-36 |
| Plan fetch | ✅ | 38-42 |
| Environment population | ✅ | 44-56 |
| Script registration | ✅ | 58-67 |
| EXPERIMENT_START emission | ✅ | 87-90 |

---

### 2.2 Step Loop ⚠️ FUNCTIONAL WITH ISSUES

**Loop Structure** (Lines 104-196):

| Requirement | Status | Notes |
|-------------|--------|-------|
| STEP_START emission | ✅ | Line 204 |
| Role iteration | ✅ | Lines 209-211 |
| STEP_END emission | ✅ | Lines 214-218 |
| Goal evaluation | ✅ | Lines 137-151 |
| maxSteps enforcement | ✅ | Lines 153-168 |
| Status polling for pause/stop | ✅ | Lines 117-132 |

> [!IMPORTANT]
> **Concurrency Issue Identified**: The `runLoop()` method re-fetches the experiment from DB at each iteration (line 117) but only copies status, not environment. If an external process modifies `currentEnvironment`, those changes could be lost.

**Code Concern** (Line 117-124):
```javascript
const freshExperiment = await Experiment.findById(this.experimentId);
// Only status is copied back:
if (freshExperiment.status !== 'RUNNING') {
    this.experiment.status = freshExperiment.status;
    // currentEnvironment NOT synced - potential data inconsistency
}
```

---

### 2.3 Role Processing ✅ MOSTLY COMPLETE

**File**: Lines 225-471 of orchestrator

| Feature | Status | Notes |
|---------|--------|-------|
| Environment deep copy | ✅ | Line 234 |
| Variable whitelist filtering | ✅ | Lines 247-266 |
| Tool resolution | ✅ | Lines 272-281 |
| System/User message construction | ✅ | Lines 285-294 |
| MODEL_PROMPT emission | ✅ | Lines 298-303 |
| Streaming inference | ✅ | Lines 343-354 |
| Tool call detection | ✅ | Lines 357-450 |
| TOOL_CALL/TOOL_RESULT events | ✅ | Lines 379-446 |
| BEFORE/AFTER_TOOL_CALL hooks | ✅ | Lines 373-377, 441-446 |
| MAX_TOOL_LOOPS safety limit | ✅ | Line 316 (set to 5) |

> [!WARNING]
> **Tool Definition NOT Passed to Ollama**: The `OllamaStrategy.chat()` method receives the `tools` parameter but does **NOT** include it in the Ollama API call:
> ```javascript
> // ollama-strategy.js line 37-42
> const stream = await client.chat({
>     model: modelName,
>     messages: history,
>     stream: true,
>     options: config,
>     // tools: tools  <-- MISSING!
> });
> ```
> This means the LLM provider will **NOT** receive tool definitions and cannot make tool calls, breaking the core agent loop.

---

### 2.4 Goal Evaluation ✅ PASS

**File**: [experiment-orchestrator.service.js:477-556](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js#L477-L556)

| Feature | Status | Notes |
|---------|--------|-------|
| Python script construction | ✅ | Uses eval() in sandbox |
| Environment injection via env vars | ✅ | Secure approach |
| Container cleanup on error | ✅ | finally block guaranteed |
| Goal description returned | ✅ | Line 537 |
| Failure propagation | ✅ | Line 548 throws error |

---

### 2.5 Termination Conditions ✅ PASS

| Condition | Implementation | Status |
|-----------|----------------|--------|
| Goal met | `result = goal.description` | ✅ |
| Max steps exceeded | `result = 'Max Steps Exceeded'` | ✅ |
| User stopped | `result = 'Stopped by User'` | ✅ |
| Error | `result = 'Error: ${message}'` | ✅ |

All termination conditions set `endTime` and emit `EXPERIMENT_END` event.

---

## Section 3: Edge Case Handling

### 3.1 Status Documented Edge Cases

| Scenario | Handling | Location |
|----------|----------|----------|
| Experiment not found | `throw Error('Experiment not found')` | Line 35 |
| Plan not found | `throw Error('ExperimentPlan not found')` | Line 41 |
| Experiment deleted mid-execution | `throw Error('Experiment deleted during execution')` | Line 119 |
| Tool not found in DB | `throw Error('Tool detected but not found')` | Line 391 |
| Container execution failure | Logged, continues or aborts based on policy | Lines 417-421 |
| Goal evaluation crash | Throws, fails experiment | Line 548 |
| Hook script failure with ABORT | Re-throws error | Line 681 |
| Hook script failure with CONTINUE | Logs and proceeds | Line 683 |

### 3.2 Undocumented Edge Cases ⚠️

| Scenario | Current Behavior | Risk |
|----------|------------------|------|
| Empty roles array | Loop completes immediately | LOW |
| Empty goals array | Never terminates until maxSteps | LOW |
| Invalid Python syntax in goal | Experiment fails | EXPECTED |
| Docker daemon unavailable | Unhandled rejection | HIGH |
| Network timeout to Ollama | Inference fails, experiment fails | MEDIUM |

> [!NOTE]
> **Retry Logic**: The SPEC §8.2 requires exponential backoff retry for LLM failures. This is **NOT IMPLEMENTED**. A single failure crashes the experiment.

---

## Section 4: Container Execution Security Analysis

### 4.1 Container Configuration ⚠️ CONCERNS

**File**: [container-pool.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js)

| Security Control | SPEC Requirement | Implementation | Status |
|-----------------|------------------|----------------|--------|
| Network isolation | §8.1 Line 609 | `NetworkMode: 'none'` | ✅ |
| Memory limit | §8.1 Line 609 | `128 * 1024 * 1024` (128MB) | ✅ |
| CPU limit | §8.1 Line 609 | NOT IMPLEMENTED | ❌ |
| PID limit | Commented out | Line 90 commented | ❌ |
| One-shot destruction | §12.4 Line 800-801 | `destroy()` called after use | ✅ |

**Security Recommendations**:

> [!CAUTION]
> **Fork Bomb Vulnerability**: The `PidsLimit` is commented out (line 90). A malicious tool script could execute:
> ```python
> import os
> while True: os.fork()
> ```
> This would exhaust system resources.

> [!CAUTION]
> **No CPU Limit**: Without CPU throttling, a malicious script could monopolize CPU:
> ```python
> while True: pass
> ```

### 4.2 Script Injection Analysis

**Goal Evaluation** (Lines 490-506):
```python
condition = os.environ.get('GOAL_CONDITION', 'False')
result = eval(condition, {}, env)
```

The `eval()` call uses an empty globals dict `{}` and `env` as locals, which provides minimal sandboxing within Python. However:

> [!WARNING]
> **Potential Sandbox Escape**: While globals is empty, Python builtins are still accessible via `__builtins__`. A crafted condition script could potentially access dangerous functions:
> ```python
> "__import__('os').system('rm -rf /')"
> ```
> However, Docker isolation should contain the blast radius.

**Hook Execution** (Lines 607-629):
Uses `exec(user_code)` with similar concerns. The Docker container is the primary sandbox.

### 4.3 Container Domain Object Inconsistency ⚠️

There are **TWO** Container implementations:

1. [src/execution/container.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/execution/container.js) - 137 lines
2. [src/domain/container.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/domain/container.js) - 104 lines

The pool manager imports from `../domain/container` (line 3 of container-pool.service.js), but the orchestrator uses the pool which uses domain/container. Yet there's also an execution/container.js with different implementation.

> [!WARNING]
> **Code Duplication**: Two container implementations exist. This is a maintenance hazard and could lead to inconsistent behavior.

---

## Section 5: Test Suite Evaluation

### 5.1 Test Execution Results

```
Test Suites: 33 passed, 33 total
Tests:       [All passing]
```

**Test Files Reviewed**:

| Test File | Coverage Area | Quality |
|-----------|---------------|---------|
| experiment.routes.test.js | Launch API | Good |
| experiment.control.test.js | Control API state machine | **Excellent** - covers all transitions |
| plan.routes.test.js | Plan CRUD | Good |
| tool/*.test.js | Tool CRUD | Comprehensive |
| experiment-orchestrator.service.test.js | Orchestrator unit | Good |
| experiment-orchestrator-hooks.test.js | Hook system | Good |
| experiment-orchestrator-hooks-integration.test.js | Hook integration | Good |
| container.test.js | Container unit | Basic |
| container.integration.test.js | Docker integration | Basic |

### 5.2 Test Coverage Gaps

| Missing Coverage | Severity |
|-----------------|----------|
| GET experiments list | HIGH - endpoint missing |
| GET experiment by ID | HIGH - endpoint missing |
| DELETE experiment | HIGH - endpoint missing |
| Logs API | HIGH - endpoint missing |
| Tool calling e2e (Ollama → Tool → Result) | MEDIUM - depends on tool fix |
| Network failure retry | MEDIUM - feature missing |
| Docker daemon unavailable | MEDIUM |
| Concurrent experiment modifications | LOW |

### 5.3 Test Quality Assessment

**Positive Patterns Observed**:
- MongoMemoryServer used for API isolation
- Jest mocks properly isolate units
- State machine testing covers all transitions (control.test.js)
- Parameterized tests used effectively

**Concerning Pattern**:
```javascript
// experiment.routes.test.js line 73
expect(res.statusCode).toBe(500); // Mongoose cast error usually results in 500 unless handled specifically
```
This comment indicates that invalid ID formats return 500 instead of 400. This is inconsistent with other endpoints.

---

## Section 6: Findings Summary

### 6.1 Critical Issues (Must Fix)

| ID | Issue | SPEC Reference | File |
|----|-------|----------------|------|
| C1 | `GET /api/experiments` not implemented | §5 Line 486 | experiment.routes.js |
| C2 | `GET /api/experiments/:id` not implemented | §5 Line 487 | experiment.routes.js |
| C3 | `DELETE /api/experiments/:id` not implemented | Requirement k | experiment.routes.js |
| C4 | `GET /api/experiments/:id/logs` not implemented | §5 Line 490 | - |
| C5 | Tools not passed to Ollama chat API | §12.2 Step 3 | ollama-strategy.js:37 |
| C6 | Environment history/snapshots not queryable | Requirement i | - |

### 6.2 High Priority Issues

| ID | Issue | Impact |
|----|-------|--------|
| H1 | SSE stream endpoint missing | No real-time UI updates |
| H2 | Plan duplicate endpoint missing | Minor feature gap |
| H3 | No CPU limit on containers | Resource exhaustion risk |
| H4 | PidsLimit commented out | Fork bomb vulnerability |
| H5 | Duplicate Container implementations | Maintenance hazard |
| H6 | No retry logic for LLM failures | Fragile execution |

### 6.3 Medium Priority Issues

| ID | Issue | Recommendation |
|----|-------|----------------|
| M1 | No experiment update prevention for ended experiments | Add status check on any update path |
| M2 | Invalid ID returns 500 on experiment launch | Handle CastError explicitly |
| M3 | Logger hardcodes stepNumber=0 for EXPERIMENT_END | Pass actual step count |
| M4 | Double `await experiment.save()` in launchExperiment | Line 36-37 duplicate call |

### 6.4 Positive Findings

- ✅ All 33 test suites pass
- ✅ Tool CRUD API is complete and well-tested
- ✅ Plan CRUD API is complete with reference validation
- ✅ Experiment control state machine is well-tested (18 transitions)
- ✅ Hook system supports all event types including custom BEFORE/AFTER_TOOL_CALL
- ✅ Goal evaluation properly sandboxed in containers
- ✅ Container one-shot policy correctly implemented
- ✅ Network isolation enabled on containers
- ✅ EventBus correctly decouples components
- ✅ Logger service properly persists to MongoDB

---

## Section 7: Recommendations

### 7.1 Immediate Actions Required

1. **Implement missing Experiment endpoints** (C1-C4, C6)
   - `GET /api/experiments` - list with status filter
   - `GET /api/experiments/:id` - full status and environment
   - `DELETE /api/experiments/:id` - only for ended experiments
   - `GET /api/experiments/:id/logs` - query by step if needed

2. **Fix Ollama tool passing** (C5)
   ```javascript
   // ollama-strategy.js line 37
   const stream = await client.chat({
       model: modelName,
       messages: history,
       stream: true,
       options: config,
       tools: tools  // ADD THIS
   });
   ```

3. **Enable container resource limits** (H3, H4)
   ```javascript
   HostConfig: {
       NetworkMode: 'none',
       Memory: 128 * 1024 * 1024,
       CpuQuota: 50000,  // 50% of one CPU
       PidsLimit: 10,    // Uncomment
   }
   ```

### 7.2 Secondary Actions

1. Add retry logic with exponential backoff for LLM calls
2. Consolidate Container implementations
3. Implement SSE endpoint for real-time updates
4. Add `/api/plans/:id/duplicate` endpoint
5. Fix double save in launchExperiment controller

---

## Section 8: Conclusion

The Scientist.ai backend demonstrates **solid foundational architecture** with proper separation of concerns (Controllers, Services, Models), comprehensive validation, and good test coverage for implemented features. The Event Bus pattern effectively decouples the execution engine from side effects.

However, the system is **NOT production-ready** due to:
1. Missing critical API endpoints for experiment observation and deletion
2. A showstopper bug preventing tool definitions from reaching the LLM
3. Incomplete container security hardening

The development team has prioritized the "happy path" but left significant gaps in API completeness and operational monitoring capabilities.

**Final Grade**: **C+**  
**Deployment Recommendation**: **NOT CLEARED FOR PRODUCTION**

---

*Report prepared by Independent Safety Inspector*  
*"In nuclear systems, we verify twice. In AI systems, we verify thrice."*
