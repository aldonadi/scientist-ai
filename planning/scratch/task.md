# Story 008: Implement Update Tool API

## Tasks

### Planning
- [x] Read story requirements and SPEC.md
- [x] Explore existing codebase (controller, model, routes, tests)
- [x] Create implementation plan

### Implementation
- [x] Add `updateTool` controller function in `tool.controller.js`
  - [x] Validate ObjectId format
  - [x] Create Zod partial schema for updates
  - [x] Handle duplicate name/namespace check
  - [x] Use `findByIdAndUpdate` with `runValidators: true`
  - [x] Handle 11000 MongoDB duplicate key error
- [x] Add PUT route in `tool.routes.js`
- [x] Update exports in controller

### Testing
- [x] Create comprehensive test file `backend/tests/api/tool/update_tool.test.js`
  - [x] 25 test cases covering all scenarios
  - [x] All tests passing

### Completion
- [x] Mark checkboxes in story file
- [x] Update backlog status to REVIEW
