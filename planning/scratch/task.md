# Script System Upgrade - Task Checklist

## Planning Phase
- [x] Read SPEC.md to understand lifecycle events and hooks
- [x] Review current experiment-orchestrator.service.js hook execution logic  
- [x] Review script.schema.js for current schema
- [x] Review frontend scripts-tab.component.ts
- [x] Review example story formats (046, 058, 063)
- [x] Create user story file (065_script_system_upgrade.md)
- [x] Register story in backlog.md
- [x] Create implementation_plan.md
- [ ] Notify user for review

## Design Decisions (To Document)
- [ ] Hook context variable design (`hook_context` vs merged into `env`)
- [ ] Script actions API design (function-based vs object-based)
- [ ] Help/reference UI for Script editor
