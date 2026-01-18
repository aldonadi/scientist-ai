# Variable Visibility Per Role

- **Status:** REVIEW
- **Points:** 8
- **Story ID:** 063
- **Type:** Feature

## Description
Implement a configurable system that allows users to specify which environment variables each Role can "see" automatically as part of their system prompt. This prevents roles from needing to call tools to discover state they should already know, while also enabling information asymmetry between roles (e.g., a "Dealer" role shouldn't see player cards).

## User Story
**As a** Experiment Designer,
**I want** to configure which environment variables are visible to each Role,
**So that** I can control information flow between agents and reduce unnecessary tool calls.

## Acceptance Criteria

### Environment Tab (Expand/Collapse Detail Row)
- [x] Each variable row has an expand/collapse chevron (▶/▼)
- [x] Expanding a row reveals a "Role Visibility" section with checkboxes for each defined Role
- [x] Checking/unchecking a role updates that Role's `variableWhitelist` array
- [x] A summary column shows "X Roles" or "All" for quick scanning
- [x] A button to open the full Visibility Matrix modal is visible

### Role Editor Tab (Searchable Variable Picker)
- [x] Replace the current comma-separated text input with a chip-based UI
- [x] Show selected variables as removable chips (like the tool picker)
- [x] Provide a searchable dropdown/popover listing all defined environment variables
- [x] Each variable option shows its name, type, and current initial value
- [x] Include a "Select All" / "Clear All" quick action
- [x] A button to open the full Visibility Matrix modal is visible

### Visibility Matrix Modal (Full Grid View)
- [x] Modal can be opened from both Environment tab and Role editor
- [x] Displays a grid with Variables as rows and Roles as columns
- [x] Each cell is a clickable checkbox (visible/hidden)
- [x] Row-level "All" / "None" buttons to set visibility for all roles
- [x] Column-level "All" / "None" buttons to set visibility for all variables
- [x] Changes are reflected immediately in the underlying data model
- [x] Modal has Save/Cancel buttons (or auto-saves with close)

### Data Model
- [ ] Uses existing `variableWhitelist: string[]` field on Role schema
- [ ] Empty whitelist means "all variables visible" (existing behavior)
- [ ] Add optional `variableVisibilityMode: 'ALL' | 'WHITELIST'` field for explicit semantics

## Technical Notes
- The Role schema already has `variableWhitelist: [{ type: String, trim: true }]`
- Frontend `Role` interface already has `variableWhitelist: string[]`
- Both Environment and Roles tabs receive the full `roles` array from `PlanEditorComponent`
- Changes should propagate via existing `rolesChange.emit()` pattern

## UI Mockups (ASCII Reference)

### Environment Tab - Expanded Row (Option B)
```
│ ▼ deck          │  Array   │  [1,2,3,4,5...]          │  1 Role  │    Del   │
│   ├────────────────────────────────────────────────────────────────────────┤
│   │ 👁️ Role Visibility:                                                    │
│   │    ☑ Dealer    ☐ Player    ☐ Observer         [Open Matrix]           │
│   └────────────────────────────────────────────────────────────────────────┘
```

### Role Editor - Variable Picker (Option F)
```
│  👁️ Visible Environment Variables                                           │
│  [current_sum ×] [deck ×] [game_phase ×]                     [Open Matrix]  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 [Search variables...                                              ] │ │
│  │  ☑ current_sum (Number)    0                                           │ │
│  │  ☑ deck (Array)            [52 items]                                  │ │
│  │  ☐ player_hand (Array)     [0 items]                                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
```

### Visibility Matrix Modal (Option J)
```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│  🔧 Variable Visibility Matrix                              [Save] [Cancel]           │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                        │ Dealer │ Player │ Observer │ ← Roles                         │
│  ──────────────────────┼────────┼────────┼──────────┼                                 │
│  current_sum (Number)  │   ☑    │   ☑    │    ☑     │  [All] [None]                   │
│  deck (Array)          │   ☑    │   ☐    │    ☐     │  [All] [None]                   │
│  player_hand (Array)   │   ☐    │   ☑    │    ☐     │  [All] [None]                   │
│  ──────────────────────┼────────┼────────┼──────────┤                                 │
│                        │ [All]  │ [All]  │  [All]   │                                 │
│                        │ [None] │ [None] │  [None]  │                                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Testing
1. **Environment Tab:** Create variables, expand rows, toggle role checkboxes, verify whitelist updates
2. **Role Editor:** Open role, use variable picker, add/remove variables via chips, verify persistence
3. **Matrix Modal:** Open from both tabs, toggle cells, use bulk buttons, verify changes sync to both views
4. **Data Persistence:** Save plan, reload, verify visibility settings are preserved
5. **Edge Cases:** Test with 0 roles, 0 variables, many roles (5+), many variables (10+)

## Dependencies
- Depends on: 033_ui_plan_editor_environment, 034_ui_plan_editor_roles (both in REVIEW)
- Blocked by: None (existing schema supports this feature)

## Review Log
- 2026-01-18: Story created. Feature designed with three UI layers for progressive disclosure.
