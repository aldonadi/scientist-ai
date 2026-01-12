# Task: Story 050 - Fix Ollama Tool Parameter Passing

## Objective
Fix the bug where provider strategies receive but ignore the `tools` parameter.

## Checklist

### Planning ✅
- [x] Research Ollama API tool format
- [x] Audit all provider strategies (Ollama, OpenAI, Anthropic)
- [x] Create implementation plan
- [x] Get user approval on plan

### Implementation ✅
- [x] Fix `ollama-strategy.js` - add tools param
- [x] Fix `openai-strategy.js` - add tools param and fix parsing
- [x] Fix `anthropic-strategy.js` - add tools param and fix parsing
- [x] Add unit tests for tools parameter passing

### Verification ✅
- [x] Run unit tests (9/9 pass)
- [x] Update story file with completion
- [x] Update backlog status
