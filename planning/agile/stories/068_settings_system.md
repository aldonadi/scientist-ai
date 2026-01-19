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

## Design Goals & Requirements

### 1. Simple to Specify (Developer Experience)
- **Single-source-of-truth**: Settings should be defined in ONE place (a registry/schema file) with all metadata (name, description, type, default, validation rules, tags, groups).
- **Minimal boilerplate**: Adding a new setting should require editing only the registry file.
- **Declarative syntax**: Use a clean JSON or JS object syntax for definitions.

### 2. Hierarchical & Taggable
- **Nested groups**: Settings organized into a tree structure (e.g., `General > Appearance`, `Experiments > Execution > Limits`).
- **Tags**: Each setting can have optional tags for cross-cutting concerns (e.g., `#performance`, `#security`, `#experimental`).

### 3. Searchable
- **Full-text search**: Filter settings by name, description, tags, or group path.
- **Instant filtering**: As-you-type filtering in the UI, no page reload.

### 4. Usable & Expressive
- **Type-safe values**: Strongly-typed accessors (e.g., `getSetting<number>('maxRetries')`).
- **Rich type support**: String, Integer, Float, Boolean, Enum (single-select), MultiEnum (multi-select), Freeform Text (textarea), Path, URL, JSON (for dict/array), potentially Color picker.
- **Read-only access**: Settings are read via a simple API; writes only through the Settings UI or programmatic import.

### 5. Validatable
- **Built-in validators**: `required`, `min`, `max`, `minLength`, `maxLength`, `pattern` (regex), `custom` (function).
- **Declarative validation**: Validation rules defined alongside the setting.
- **Error messages**: Clear, user-facing validation error text.

### 6. Auto-Generated UI
- **No manual UI code per setting**: The settings page is dynamically rendered from the registry.
- **Component mapping**: Each type maps to appropriate UI component (toggle, input, dropdown, textarea, etc.).
- **Inline validation**: Real-time validation feedback in the UI.
- **Group navigation**: Collapsible sections or sidebar tree for navigating setting groups.

### 7. Future User Account Compatibility
- **User scope ready**: Design with a `scope: 'user' | 'global'` field (unused initially, but structurally present).
- **Namespace isolation**: Settings keyed by namespace, allowing easy per-user override later.

### 8. Serializable & Storage Agnostic
- **Abstract storage interface**: Similar pattern to `ISecretStore` (see story 044).
- **Default implementation**: MongoDB storage for consistency with existing data.
- **Portability**: Settings exportable/importable as JSON.

---

## Technical Specification

### Core Components

#### 1. Setting Definition Schema
```javascript
// backend/src/settings/settings.registry.js
export const settingsRegistry = [
  {
    key: 'general.appearance.theme',
    name: 'Theme',
    description: 'Application color theme',
    type: 'enum',
    options: ['light', 'dark', 'system'],
    default: 'system',
    tags: ['appearance'],
    group: ['General', 'Appearance'],
    scope: 'user',  // or 'global'
    validation: { required: true },
    helpText: 'Choose a color scheme for the UI.',
  },
  {
    key: 'experiments.execution.maxConcurrent',
    name: 'Max Concurrent Experiments',
    description: 'Maximum experiments running simultaneously',
    type: 'integer',
    default: 3,
    tags: ['performance', 'limits'],
    group: ['Experiments', 'Execution'],
    scope: 'global',
    validation: { required: true, min: 1, max: 10 },
  },
  // ... more settings
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

### Settings Page Layout (Option A: Sidebar Navigation)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                          🔍 [Search settings...] │
├────────────────────────┬────────────────────────────────────────────────────┤
│ ▼ General              │  🎨 Appearance                                     │
│   ├─ Appearance        │  ─────────────────────────────────────────────────│
│   └─ Notifications     │                                                    │
│ ▼ Experiments          │  Theme                              [System ▼]    │
│   ├─ Execution         │  Application color theme                           │
│   └─ Display           │                                                    │
│ ▶ Data                 │  Compact Mode                        [  ] Off     │
│ ▶ Advanced             │  Reduce spacing for dense information display     │
│                        │                                                    │
│                        │  🔔 Notifications                                  │
│                        │  ─────────────────────────────────────────────────│
│                        │                                                    │
│                        │  Sound Effects                       [✓] On       │
│                        │  Play sounds for events and errors                 │
└────────────────────────┴────────────────────────────────────────────────────┘
```

### Settings Page Layout (Option B: Flat Filtered List)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔍 [Search settings...                                                    ] │
│ Tags: [All ▼]  Groups: [All ▼]                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🎨 GENERAL > APPEARANCE                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Theme                                                     [System ▼]   │ │
│ │ Application color theme                                  #appearance   │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Compact Mode                                                [  ] Off   │ │
│ │ Reduce spacing for dense information display             #appearance   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ⚡ EXPERIMENTS > EXECUTION                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Max Concurrent Experiments                                    [ 3  ]   │ │
│ │ Maximum experiments running simultaneously        #performance #limits │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Single Setting Row (Expanded with Validation Error)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Max Retries                                                     [ -5  ]   │
│ Number of retry attempts for failed operations               #reliability │
│ ⚠️ Value must be between 0 and 10                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Input Type Examples
```
String:     [___________________________________]
Integer:    [  5  ] [▲] [▼]   (spinner or plain input)
Float:      [ 0.75 ]
Boolean:    [✓] Enable feature   OR   ( On  )(•Off•)
Enum:       [Option B ▼]
MultiEnum:  [✓] Option A  [ ] Option B  [✓] Option C
Textarea:   ┌────────────────────────────────────┐
            │ Multi-line content here...         │
            │                                    │
            └────────────────────────────────────┘
Path:       [/home/user/data        ] [📁 Browse]
URL:        [https://example.com    ] [🔗 Test]
JSON:       Code editor with syntax highlighting
```

---

## Acceptance Criteria

### Backend
- [ ] `settingsRegistry` schema defined with at least 5 example settings
- [ ] `ISettingsStore` interface defined
- [ ] `MongoDBSettingsStore` implementation complete
- [ ] `SettingsService` with `get`, `set`, `getAll`, `reset`, `validate`
- [ ] REST endpoints: `GET/PUT/DELETE /api/settings/:key`
- [ ] `GET /api/settings/definitions` returns full registry for frontend
- [ ] Validation runs on `PUT` and returns 400 with errors on failure
- [ ] Export/Import endpoints working

### Frontend
- [ ] Settings page accessible from main navigation
- [ ] Settings rendered dynamically from definitions API
- [ ] Search filters settings by name, description, tags
- [ ] Hierarchical navigation (sidebar or collapsible sections)
- [ ] Each setting type renders appropriate editor component
- [ ] Real-time validation with inline error display
- [ ] Save button (or auto-save with debounce)
- [ ] Reset to default per-setting

### Cross-Cutting
- [ ] New setting can be added by editing only `settings.registry.js`
- [ ] Settings persist across server restarts
- [ ] Settings load on application startup

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

## Open Questions & Clarifications Needed

> [!IMPORTANT]
> **The following questions should be resolved before implementation begins:**

### 1. UI Layout Preference
Which layout style do you prefer?
- **Option A**: Sidebar tree navigation (like VS Code settings)
- **Option B**: Flat filtered list with collapsible groups (like Chrome settings)

### 2. Data Types Priority
Which types are must-haves for v1?
- **Essential**: String, Integer, Boolean, Enum — probably yes
- **Nice-to-have**: Float, Textarea, Path, URL, MultiEnum, JSON/Dict
- **Defer?**: Color picker, File upload

### 3. Auto-save vs. Explicit Save
Should settings:
- **Auto-save** on change (with debounce, like most modern apps)?
- **Require explicit Save button** (like traditional preferences dialogs)?
- **Hybrid**: Auto-save simple types, explicit save for complex/dangerous ones?

### 4. Import/Export Scope
For export/import:
- Should this be a user-facing feature in the UI?
- Or a developer/admin tool (CLI or hidden endpoint)?

### 5. Initial Settings Catalog
What are the first 5-10 settings you'd like to see implemented? Examples:
- Theme (light/dark/system)
- Default LLM provider
- Max concurrent experiments
- Log retention period
- Container timeout defaults
- API rate limits

### 6. Storage Backend Priority
You mentioned multiple storage backends (MongoDB, SQLite, flat files, Windows Registry). For v1:
- Is MongoDB sufficient?
- Should we implement the interface but only build MongoDB initially?

### 7. Validation Complexity
For custom validation functions:
- Should validators be pure JavaScript functions in the registry?
- Or string-based rules that map to predefined validators?
- (Former is more flexible, latter is more portable/serializable)

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
