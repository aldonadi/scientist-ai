# Implement Tool Editor UI

- **Status:** READY
- **Points:** 5
- **Story ID:** 031
- **Type:** Feature

## Description
Create the Tool Editor component with Monaco Editor integration.

## Mockup (Selected: Split Pane - Modified)
```text
+-----------------------------------------------------------------------------+
|  < Back to Tools       CREATE NEW TOOL                  [Save] [Test Run]   |
+-----------------------------------------------------------------------------+
|  METADATA & CONFIG                  |  IMPLEMENTATION (Python 3.10)         |
|                                     |                                       |
|  Namespace: [ finance_v1        ]   |  import requests                      |
|                                     |  import json                          |
|  Name: [ stock_analyzer         ]   |                                       |
|                                     |  def execute(env, args):              |
|  Description:                       |      """                              |
|  [ Analyzes stock trends using... ] |      Analyzes stock data.             |
|  [                              ]   |      """                              |
|                                     |      ticker = args.get('ticker')      |
|  PARAMETERS (JSON Schema)           |      # ... code here ...              |
|  +-------------------------------+  |                                       |
|  | {                             |  |                                       |
|  |   "type": "object",           |  |                                       |
|  |   "properties": {             |  |                                       |
|  |     "ticker": { "type"...     |  |                                       |
|  +-------------------------------+  |                                       |
|                                     |                                       |
|                                     |                                       |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** a code editor for tools,
**So that** I can write python code easily.

## Acceptance Criteria
- [ ] Monaco Editor for `code` field.
- [ ] JSON editor for `parameters`.
- [ ] **Feature**: Auto-generate JSON Schema from Python function signature (parameters & docstring) upon request or change.
- [ ] **Feature**: Allow user to manually edit the generated JSON Schema.
- [ ] Save button calls API.

## Testing
1. Edit code.
2. Save.
3. Reload to verify persistence.

## Review Log
