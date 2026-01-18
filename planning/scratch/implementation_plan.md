# Variable Visibility Per Role - Implementation Plan

Allow users to configure which environment variables each Role can see "for free" in their system prompt, without requiring tool calls.

## Proposed Changes

### Visibility Matrix Modal Component (New)

#### [NEW] [visibility-matrix-modal.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/visibility-matrix-modal.component.ts)

Create a standalone modal component with:
- **Inputs:** `roles: Role[]`, `variableKeys: string[]`, `isOpen: boolean`
- **Outputs:** `rolesChange: EventEmitter<Role[]>`, `closeModal: EventEmitter<void>`
- **Features:**
  - Grid layout: Variables as rows, Roles as columns
  - Each cell: Clickable checkbox bound to role's `variableWhitelist`
  - Row-level "All" / "None" buttons
  - Column-level "All" / "None" buttons
  - Close button for modal dismissal

---

### Environment Tab Updates

#### [MODIFY] [environment-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/environment-tab.component.ts)

1. **Add new inputs:**
   ```typescript
   @Input() roles: Role[] = [];
   @Output() rolesChange = new EventEmitter<Role[]>();
   ```

2. **Add expand/collapse state:** Track which variable rows are expanded via `expandedRows: Set<number>`

3. **Add table column:** "Visible" column showing "X Roles" or "All" summary

4. **Add expandable row detail:** When expanded, show checkboxes for each role

5. **Add "Open Matrix" button:** Opens the visibility matrix modal

6. **Logic:** When role checkboxes are toggled, update the corresponding Role's `variableWhitelist` and emit `rolesChange`

---

### Role Editor Tab Updates

#### [MODIFY] [roles-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/roles-tab.component.ts)

1. **Add new input for environment keys:**
   ```typescript
   @Input() environmentKeys: string[] = [];
   ```

2. **Replace text input with chip-based picker:**
   - Display selected variables as removable chips (similar to tools)
   - Add a searchable dropdown for selecting variables
   - Show variable type and initial value in dropdown options

3. **Add "Open Matrix" button:** Opens the visibility matrix modal

4. **Logic:** Selected chips update `editingRole.variableWhitelist` array

---

### Plan Editor Component Updates

#### [MODIFY] [plan-editor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/plan-editor.component.ts)

1. **Import new modal component**

2. **Pass roles to Environment tab:**
   ```html
   <app-environment-tab 
     [(environment)]="plan.initialEnvironment"
     [roles]="plan.roles"
     (rolesChange)="plan.roles = $event">
   </app-environment-tab>
   ```

3. **Pass environment keys to Roles tab:**
   ```html
   <app-roles-tab 
     [(roles)]="plan.roles"
     [providers]="providers"
     [environmentKeys]="getEnvironmentKeys()">
   </app-roles-tab>
   ```

4. **Add modal state and handlers**

---

### Index Export

#### [MODIFY] [index.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/index.ts)

Export the new `VisibilityMatrixModalComponent`

---

## Verification Plan

### Manual Browser Testing

Since this is a frontend UI feature with no backend changes, verification will be manual browser testing:

1. **Start the app:**
   ```bash
   cd frontend && npm start
   ```
   Navigate to `http://localhost:4200/plans` in browser

2. **Environment Tab - Expand/Collapse:**
   - Create or edit a plan with 2+ roles and 3+ environment variables
   - Verify each variable row has an expand chevron (▶)
   - Click chevron → verify row expands showing role checkboxes
   - Toggle checkboxes → verify changes persist
   - Click chevron again → verify row collapses

3. **Environment Tab - Summary Column:**
   - Verify "Visible" column shows "X Roles" count
   - When all roles checked → verify shows "All"

4. **Role Editor - Variable Picker:**
   - Edit a role
   - Verify selected variables appear as removable chips
   - Click search box → verify dropdown shows all env variables
   - Select a variable → verify chip appears
   - Click × on chip → verify chip is removed
   - Verify whitelist updates in role data

5. **Visibility Matrix Modal:**
   - Click "Open Matrix" from Environment tab → verify modal opens
   - Click "Open Matrix" from Role editor → verify modal opens
   - Verify grid shows all variables × all roles
   - Click a cell → verify checkbox toggles
   - Click row "All" → verify all cells in row checked
   - Click column "None" → verify all cells in column unchecked
   - Close modal → verify changes reflected in both tabs

6. **Data Persistence:**
   - Save the plan
   - Reload the page
   - Verify visibility settings are preserved

### Build Verification

```bash
cd frontend && npm run build
```

Verify build completes without errors.
