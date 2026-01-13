# UI Tweaks: Plan Editor

- [x] Analyze existing Plan Editor components <!-- id: 0 -->
- [x] **Request 1: Add Goal Button Style** <!-- id: 1 -->
    - [x] Identify `Roles` tab "Add Role" button styles <!-- id: 2 -->
    - [x] Update `Workflow` (Goals) tab "Add Goal" link to matching button <!-- id: 3 -->
- [x] **Request 2: Restructure Tabs** <!-- id: 4 -->
    - [x] Rename `Workflow` tab to `Goals` in UI <!-- id: 5 -->
    - [x] Create new `Scripts` tab <!-- id: 6 -->
    - [x] Move Lifecycle/Scripts section to `Scripts` tab <!-- id: 7 -->
    - [x] Update component logic/HTML to support new tab structure <!-- id: 8 -->
    - [x] Consistency rename in source code (if applicable/safe) <!-- id: 9 -->
- [x] **Request 3: Hook List Formatting** <!-- id: 10 -->
    - [x] Locate hook list display logic <!-- id: 11 -->
    - [x] Implement conditional formatting: `HOOK_NAME ($num)` for count > 0, `($num) HOOK_NAME` otherwise <!-- id: 12 -->
- [x] Verify changes <!-- id: 13 -->

# UI Tweaks: Tool Editor

- [x] **Request 4: Pre-populate Tool Code** <!-- id: 14 -->
    - [x] Locate `ToolEditorComponent` <!-- id: 15 -->
    - [x] Define boilerplate code template <!-- id: 16 -->
    - [x] Update initialization logic to populate `code` field with template for new tools <!-- id: 17 -->
    - [x] Verify placeholder is replaced by actual value <!-- id: 18 -->
