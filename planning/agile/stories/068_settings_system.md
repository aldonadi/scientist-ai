# Settings System

- **Status:** READY
- **Points:** 13
- **Story ID:** 068
- **Type:** Feature

## Description
Implement a comprehensive, extensible Settings system that enables users to configure application behavior through a rich UI. The system should be developer-friendly (easy to add new settings), user-friendly (searchable, organized), and future-proof (ready for user accounts and pluggable storage backends).

## User Story
**As a** User,
**I want** to configure application behavior through a settings page,
**So that** I can customize the application to my preferences and workflows.

**As a** Developer,
**I want** a simple, declarative way to define new settings,
**So that** I can add configuration options without touching multiple parts of the codebase.

---

## Design Decisions (Resolved)

| Question | Decision |
|----------|----------|
| UI Layout | **Hybrid:** Sidebar (default) → Flat list (on search) |
| Essential Data Types | String, Integer, Float, Boolean, Enum, JSON |
| Save Behavior | Auto-save on change (with debounce) |
| Import/Export | Available to all users, not admin-only |
| Storage Backend | MongoDB only for v1 (with interface for future) |
| Validation Approach | Zod-based (consistent with existing codebase) |
| Advanced Settings | Flag as `advanced: true`, hidden by default |
| Schema Versioning | Required for v1, enables import compatibility |
| Validation Error UI | Red border + light red background + inline error |

---

## Design Goals & Requirements

### 1. Simple to Specify (Developer Experience)
- **Single-source-of-truth**: Settings defined in ONE place (registry file) with all metadata.
- **Minimal boilerplate**: Adding a new setting requires editing only the registry file.
- **Declarative syntax**: Clean JS object syntax for definitions.

### 2. Hierarchical & Taggable
- **Nested groups**: Tree structure (e.g., `Providers > Ollama`, `Experiments > Limits`).
- **Tags**: Optional tags for cross-cutting concerns (e.g., `#performance`, `#experimental`).
- **Advanced flag**: Settings can be marked `advanced: true` and hidden by default.

### 3. Searchable
- **Full-text search**: Filter by name, description, tags, or group path.
- **Instant filtering**: As-you-type filtering in the UI.

### 4. Usable & Expressive
- **Type support for v1**: String, Integer, Float, Boolean, Enum, JSON.
- **Deferred types**: MultiEnum, Path, URL, Textarea, Color picker.
- **Read-only access**: Simple getter API; writes via Settings UI or import.

### 5. Validatable (Zod-Based)
- **Leverage existing Zod patterns** already used in the codebase for API validation.
- **Declarative rules**: Each setting defines a Zod schema fragment (e.g., `z.number().min(2048).max(131072)`).
- **Error messages**: Zod's built-in error formatting for user-facing messages.

### 6. Auto-Generated UI
- **Dynamic rendering**: Settings page generated from registry definitions.
- **Component mapping**: Type → UI component (toggle, input, dropdown, JSON editor).
- **Inline validation**: Real-time feedback using Zod validation.
- **Group navigation**: Multiple layout options to be workshopped via ASCII mockups.

### 7. Future User Account Compatibility
- **User scope ready**: `scope: 'user' | 'global'` field (unused initially, structurally present).
- **Namespace isolation**: Settings keyed for easy per-user override later.

### 8. Serializable & Storage Agnostic
- **Interface pattern**: `ISettingsStore` (similar to `ISecretStore`).
- **v1 implementation**: MongoDB only.
- **Schema versioning**: Export includes version number for migration compatibility.
- **User-accessible export/import**: Available in Settings UI.

---

## Technical Specification

### Core Components

#### 1. Setting Definition Schema (Zod-Based Validation)
```javascript
// backend/src/settings/settings.registry.js
const { z } = require('zod');

// Schema version for export/import compatibility
export const SETTINGS_SCHEMA_VERSION = 1;

export const settingsRegistry = [
  // === PROVIDERS > OLLAMA ===
  {
    key: 'providers.ollama.apiBaseUrl',
    name: 'API Base URL',
    description: 'Base URL for the Ollama API server',
    type: 'string',
    default: 'http://localhost:11434',
    tags: ['ollama', 'connection'],
    group: ['Providers', 'Ollama'],
    scope: 'global',
    advanced: false,
    validator: z.string().url('Must be a valid URL'),
  },
  {
    key: 'providers.ollama.contextLength',
    name: 'Context Length',
    description: 'Maximum context window size for model prompts',
    type: 'integer',
    default: 4096,
    tags: ['ollama', 'performance'],
    group: ['Providers', 'Ollama'],
    scope: 'global',
    advanced: false,
    validator: z.number().int().min(2048).max(131072),
  },
  {
    key: 'providers.ollama.modelOptions',
    name: 'Model Options',
    description: 'Additional JSON config options sent with model prompts (e.g., temperature, reasoning effort)',
    type: 'json',
    default: { temperature: 0.7 },
    tags: ['ollama', 'advanced'],
    group: ['Providers', 'Ollama'],
    scope: 'global',
    advanced: true,  // Hidden by default
    validator: z.record(z.any()).refine(
      (obj) => typeof obj === 'object' && obj !== null,
      { message: 'Must be a valid JSON object' }
    ),
    helpText: 'JSON object with keys like: temperature, top_p, top_k, seed, etc.',
  },
  // ... more settings to be added as needed
];
```

#### 2. Settings Service (Backend)
```javascript
// backend/src/services/settings/settings.service.js
class SettingsService {
  constructor(store) { this.store = store; }  // Injected storage backend

  async get(key, userId = null) { /* ... */ }
  async set(key, value, userId = null) { /* ... */ }
  async getAll(userId = null) { /* ... */ }
  async reset(key, userId = null) { /* ... */ }
  getDefinition(key) { /* Return metadata from registry */ }
  getAllDefinitions() { /* Return full registry for UI */ }
  validate(key, value) { /* Run validators, return errors */ }
}
```

#### 3. Settings Store Interface
```javascript
// backend/src/services/settings/settings-store.interface.js
class ISettingsStore {
  async get(key, scope = {}) { throw new Error('Not implemented'); }
  async set(key, value, scope = {}) { throw new Error('Not implemented'); }
  async delete(key, scope = {}) { throw new Error('Not implemented'); }
  async getAll(scope = {}) { throw new Error('Not implemented'); }
}
```

#### 4. MongoDB Settings Store
```javascript
// backend/src/services/settings/mongodb-settings-store.js
class MongoDBSettingsStore extends ISettingsStore {
  // Uses a Settings collection: { key, value, userId?, updatedAt }
}
```

#### 5. REST API Endpoints
```
GET    /api/settings              - Get all settings (values + definitions)
GET    /api/settings/:key         - Get single setting
PUT    /api/settings/:key         - Update setting (with validation)
DELETE /api/settings/:key         - Reset to default
GET    /api/settings/definitions  - Get registry (for UI rendering)
POST   /api/settings/export       - Export all as JSON
POST   /api/settings/import       - Import from JSON
```

#### 6. Frontend Components (Angular)
- `SettingsPageComponent` - Main page, handles search/navigation
- `SettingsGroupComponent` - Renders a collapsible group
- `SettingEditorComponent` - Polymorphic editor for a single setting
- `SettingsSearchComponent` - Search input with live filtering
- `SettingsService` (Angular) - API client + local cache

---

## UI Mockups (ASCII Reference)

### UI Layout Strategy: Hybrid Approach

**Decision:** Implement BOTH layout modes with automatic switching:
- **Default (no search):** Sidebar navigation (Option A) - hierarchical browsing
- **When searching:** Flat filtered list (Option B) - command-palette style results
- The transition should be smooth; as soon as the user types in the search box, the sidebar collapses and results appear in a flat list

**Navigation Entry Point:**
- The ⚙️ button in the header (already exists but not wired) navigates to `/settings`
- Settings page is a full-page view, not a modal

---

### Default View: Sidebar Navigation
When no search query is active, show hierarchical sidebar with settings grouped.
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                          🔍 [Search settings...] │
├────────────────────────┬────────────────────────────────────────────────────┤
│ ▼ Providers            │  🔗 Ollama                                          │
│   └─ Ollama ←selected  │  ─────────────────────────────────────────────────  │
│ ▶ Experiments          │                                                     │
│ ▶ Display              │  API Base URL                   [http://localhost:11434]
│                        │  Base URL for the Ollama API server                 │
│ ────────────────────   │                                                     │
│ [ ] Show Advanced      │  Context Length                          [  4096  ] │
│                        │  Maximum context window size      #ollama #perf     │
│                        │                                                     │
│                        │  ─────────────────────────────────────────────────  │
│                        │                                          [↺ Reset]  │
└────────────────────────┴────────────────────────────────────────────────────┘
│                         [Export Settings] [Import Settings] [Reset All]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Search Active: Flat Filtered List
When user types in search box, sidebar disappears and results appear as a flat list.
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔍 [context                                                           ] [✕] │
│ Showing 2 results matching "context"                 [ ] Show Advanced      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔗 PROVIDERS > OLLAMA                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Context Length                                              [  4096  ] │ │
│ │ Maximum context window size for model prompts        #ollama #perf [↺] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 📊 EXPERIMENTS > DISPLAY                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Show Context in Logs                                          [✓] On  │ │
│ │ Display full context in experiment step logs           #display   [↺] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Validation Error Styling
Settings with validation errors expand to show the error message. The entire row gets a red-tinted background/border for visibility.
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NORMAL ROW (valid)                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ API Base URL                                  [http://localhost:11434] │ │
│ │ Base URL for the Ollama API server                      #ollama    [↺] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ERROR ROW (invalid) — red border, light red background                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Context Length                                              [  500  ]  │ │▒
│ │ Maximum context window size for model prompts        #ollama #perf [↺] │ │▒ ← red border
│ │ ⚠️ Must be between 2048 and 131072                                      │ │▒
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ↑ light red background (#FEE2E2 or similar)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**CSS Notes:**
- Valid row: `border: 1px solid #E5E7EB` (gray-200)
- Error row: `border: 2px solid #EF4444` (red-500), `background: #FEF2F2` (red-50)
- Error message: `color: #DC2626` (red-600), appears below the input

---

### Input Type Examples
```
String:     [___________________________________]
Integer:    [  5  ] [▲][▼]   (spinner or plain input)
Float:      [ 0.75 ]
Boolean:    [✓] Enable feature   OR   ●On ○Off (toggle)
Enum:       [Option B ▼]
JSON:       ┌────────────────────────────────────┐
            │ {                                  │
            │   "temperature": 0.7,              │
            │   "top_p": 0.9                     │
            │ }                                  │
            └────────────────────────────────────┘
            (monaco editor or syntax-highlighted textarea)
```

---

### Advanced Settings Toggle
When "Show Advanced" is unchecked (default), settings with `advanced: true` are hidden.
```
┌────────────────────────┐
│ [ ] Show Advanced      │  ← unchecked: advanced settings hidden
└────────────────────────┘

┌────────────────────────┐
│ [✓] Show Advanced      │  ← checked: advanced settings visible
└────────────────────────┘

Advanced settings could also have a subtle visual indicator (e.g., 🔧 icon or muted styling)
```

---

## Acceptance Criteria

### Backend
- [ ] `settingsRegistry` with initial Ollama settings (apiBaseUrl, contextLength, modelOptions)
- [ ] `SETTINGS_SCHEMA_VERSION` constant for export versioning
- [ ] `ISettingsStore` interface defined
- [ ] `MongoDBSettingsStore` implementation (key, value, userId?, updatedAt)
- [ ] `SettingsService` with `get`, `set`, `getAll`, `reset`, `validate`, `resetAll`
- [ ] Zod validators run on `set` and return 400 with formatted errors on failure
- [ ] REST endpoints: `GET/PUT/DELETE /api/settings/:key`
- [ ] `GET /api/settings/definitions` returns registry metadata for frontend
- [ ] `POST /api/settings/export` exports JSON with schema version
- [ ] `POST /api/settings/import` imports JSON with migration support
- [ ] `POST /api/settings/reset-all` resets all settings to defaults

### Frontend
- [ ] Settings page accessible via ⚙️ header button → `/settings` route
- [ ] **Default view:** Sidebar navigation with collapsible group tree
- [ ] **Search view:** Flat filtered list (command-palette style) when search query active
- [ ] Smooth transition between sidebar and search views
- [ ] Search bar filters by name, description, tags, group
- [ ] "Show Advanced" toggle to reveal `advanced: true` settings
- [ ] Each type renders appropriate editor (string, integer, float, boolean, enum, JSON)
- [ ] Auto-save with debounce on change
- [ ] Real-time validation with inline error display
- [ ] Validation error rows: red border, light red background, error message below
- [ ] Per-setting reset icon [↺] (visible when value differs from default)
- [ ] Factory reset button with confirmation modal (type "RESET" to confirm)
- [ ] Export/Import buttons in UI footer

### Cross-Cutting
- [ ] New setting added by editing only `settings.registry.js`
- [ ] Settings persist in MongoDB across server restarts
- [ ] Export includes `schemaVersion` for migration compatibility

---

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/services/settings/settings.service.test.js`
- **Cases**:
    - Registry parsing and definition retrieval
    - Validation: required, min/max, pattern matching
    - Get/Set/Reset operations
    - Unknown key handling

### Integration Tests
- **File**: `backend/tests/settings.integration.test.js`
- **Cases**:
    - API endpoints return correct data
    - PUT validates and rejects invalid values
    - Export/Import roundtrip

### Manual/Browser Tests
- Open Settings page, verify all settings render
- Search filters correctly
- Change a setting, reload page, verify persistence
- Trigger validation error, verify UI feedback

---

## Dependencies
- None (this is a foundational feature)

---

## Technical Elaborations

### Validation: Zod-Based Approach

Since the codebase already uses Zod for API validation (see `tool.schema.js`, `provider.schema.js`), we'll use the same pattern for settings:

**How it works:**
- Each setting has a `validator` property that is a Zod schema.
- Validation runs on the backend before persisting any change.
- Zod provides human-readable error messages out of the box.
- The same validator can run on frontend (Zod works in browser) for instant feedback.

**Example validators:**
```javascript
z.string().min(1)                         // Non-empty string
z.string().url()                          // Valid URL
z.string().regex(/^[a-z]+$/)              // Regex pattern
z.number().int().min(0).max(100)          // Bounded integer
z.number().positive()                     // Positive float
z.boolean()                               // Boolean
z.enum(['light', 'dark', 'system'])       // Enum selection
z.record(z.any())                         // Arbitrary JSON object
```

**Frontend note:** For the UI, we'll serialize the validator "shape" (type, min, max, etc.) into metadata that Angular can use to render appropriate inputs and show validation errors without running Zod directly.

---

### Migration Strategy

When settings keys, types, or validation rules change between versions:

**Scenario 1: Adding a new setting**
- No migration needed. New settings use their default value automatically.

**Scenario 2: Renaming a setting key**
- Migration function maps `old.key` → `new.key` on import.
- Old key is deleted, new key is created with same value.

**Scenario 3: Changing a setting's type**
- Migration function converts the value (e.g., string `"3"` → integer `3`).
- If conversion fails, use the new default.

**Scenario 4: Removing a setting**
- Orphaned settings are ignored on import (warning logged).
- Cleanup task can remove orphaned settings from storage.

**Implementation:**
```javascript
// backend/src/settings/migrations.js
const migrations = {
  1: (data) => data,  // v1: no changes (initial version)
  2: (data) => {
    // Example: rename 'ollama.baseUrl' → 'providers.ollama.apiBaseUrl'
    if (data['ollama.baseUrl']) {
      data['providers.ollama.apiBaseUrl'] = data['ollama.baseUrl'];
      delete data['ollama.baseUrl'];
    }
    return data;
  },
};

function migrateSettings(data, fromVersion, toVersion) {
  let current = data;
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (migrations[v]) current = migrations[v](current);
  }
  return current;
}
```

---

### Settings Reset UX

**Per-Setting Reset:**
- Each setting row has a small "↺" reset icon (only visible if value differs from default).
- Clicking shows a confirmation: "Reset 'API Base URL' to default value?" with Cancel/Reset buttons.
- Uses the existing modal dialog component.

**Factory Reset (All Settings):**
- Button at bottom of Settings page: "Reset All Settings to Defaults".
- Confirmation modal with strong warning: "This will reset ALL settings to their default values. This cannot be undone."
- Requires typing "RESET" or similar to confirm (prevents accidental activation).

**ASCII Mockup:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Reset All Settings                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This will reset ALL settings to their default values.         │
│  This action cannot be undone.                                  │
│                                                                 │
│  Type RESET to confirm: [__________]                            │
│                                                                 │
│                                [Cancel]  [Reset All Settings]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recommendations & Considerations

### Recommendation 1: Start with Single-File Registry
A single `settings.registry.js` file keeps definitions centralized. As the settings catalog grows, we can modularize into `settings/general.js`, `settings/experiments.js`, etc., all imported into a main registry.

### Recommendation 2: Use Component Factory Pattern for UI
Create a factory that maps `type` → Angular component. This makes adding new types straightforward and keeps the rendering logic clean.

### Recommendation 3: Consider Config Schema Versioning
For future import/export compatibility, include a schema version in exported JSON. This helps with migrations if the settings structure changes.

### Recommendation 4: Leverage Existing Patterns
- Follow `ISecretStore` pattern for `ISettingsStore` (story 044)
- Follow existing controller/service structure for new endpoints
- Reuse existing form validation patterns from Plan Editor

### Recommendation 5: Don't Over-Engineer User Scoping Yet
For now, store all settings with `userId: null`. The schema supports it, so adding multi-user is a data layer change, not an architecture change.

---

## Estimated Points Breakdown
| Component                          | Est. Points |
|------------------------------------|-------------|
| Backend: Registry + Schema         | 1           |
| Backend: Service + Validation      | 2           |
| Backend: Storage Interface + Mongo | 2           |
| Backend: REST API                  | 2           |
| Frontend: Settings Page Base       | 2           |
| Frontend: Dynamic Editors          | 2           |
| Frontend: Search + Navigation      | 1           |
| Testing                            | 1           |
| **Total**                          | **13**      |

---

## Notes
This is a large, foundational story. Consider breaking into sub-stories if preferred:
- 068a: Backend settings registry + service + API
- 068b: Storage interface + MongoDB implementation
- 068c: Frontend settings page and dynamic editors
- 068d: Search, navigation, and polish

---

## Review Log
- **2026-01-19**: Story drafted. Awaiting product owner review and clarification on open questions.
