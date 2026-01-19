# Script System Upgrade - Task Checklist

## Planning Phase ✅
- [x] Read SPEC.md to understand lifecycle events and hooks
- [x] Review current experiment-orchestrator.service.js hook execution logic  
- [x] Review script.schema.js for current schema
- [x] Review frontend scripts-tab.component.ts
- [x] Review example story formats (046, 058, 063)
- [x] Create user story file (065_script_system_upgrade.md)
- [x] Register story in backlog.md
- [x] Create implementation_plan.md
- [x] User review and approval

## Approved Design Decisions
- **Hook Context**: `context['hook']` with hook-specific data
- **Actions API**: `stop_experiment`, `log`, `end_step`, `skip_role`, `query_llm`, `pause_experiment`, `set_variable`, `inject_message`
- **LLM Queries**: Use experiment's provider with model override option
- **Edge Cases**: `end_step()` in `STEP_END` hook logs warning and is ignored

## Execution Phase (Future)
- [ ] Backend: Implement hook context injection in Python wrapper
- [ ] Backend: Implement Actions class in Python wrapper
- [ ] Backend: Process script actions in orchestrator
- [ ] Backend: Add logging for skipped roles and early step ends
- [ ] Frontend: Add Quick Reference panel to Scripts tab
- [ ] Testing: Unit tests for hook context and actions
- [ ] Testing: Integration tests for action processing
