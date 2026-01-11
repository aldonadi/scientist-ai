# Task List

- [x] Read `planning/SPEC.md` and `planning/agile/stories/027_tool_execution_logic.md` <!-- id: 0 -->
- [x] Create implementation plan <!-- id: 1 -->
- [x] Implement `ExperimentOrchestrator.processStep` tool execution logic <!-- id: 2 -->
    - [x] Parse model response for tool calls <!-- id: 3 -->
    - [x] Validate tool calls against whitelist <!-- id: 4 -->
    - [x] Execute tools <!-- id: 5 -->
    - [x] Handle tool outputs and errors <!-- id: 6 -->
    - [x] Emit `TOOL_START` (actually TOOL_CALL) and `TOOL_END` (TOOL_RESULT) events <!-- id: 7 -->
- [x] Add unit tests for tool execution logic <!-- id: 8 -->
- [x] Verify implementation <!-- id: 9 -->
- [x] Update `planning/agile/stories/027_tool_execution_logic.md` <!-- id: 10 -->
- [x] Update `planning/agile/backlog.md` <!-- id: 11 -->

## Verification & Analysis
- [x] Research `ollama-js` tool calling support (streaming) <!-- id: 12 -->
- [x] Analyze `OllamaStrategy` implementation <!-- id: 13 -->
- [x] Analyze `Provider` interface compliance <!-- id: 14 -->
- [x] Analyze `ExperimentOrchestrator` integration <!-- id: 15 -->
- [x] Report findings and needed fixes <!-- id: 16 -->

## Live Model Verification
- [x] Read Ollama tool calling documentation <!-- id: 17 -->
- [x] Create integration test script `backend/tests/integration/live-tool-calling.test.js` <!-- id: 18 -->
- [x] Ensure `gpt-oss:20b` IS NOT available (I might need to use a smaller model if that one is huge or doesn't exist, but user asked for it. I will try to pull it or ask user). Wait, `gpt-oss` sounds made up or specific. I will check `ollama list`. <!-- id: 19 -->
- [x] Run test 5 times and verify success rate <!-- id: 20 -->
