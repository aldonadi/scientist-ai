# Settings System Implementation Plan

## Overview

Implement a comprehensive Settings system following the specification in story 068. This is a **13-point story** covering:
- Backend: Registry, service, storage interface, API endpoints
- Frontend: Settings page with hybrid sidebar/search UI

---

## Phase 1: Backend Infrastructure

### 1.1 Settings Registry

#### [NEW] [settings.registry.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/settings/settings.registry.js)

Define the settings schema version and initial Ollama settings registry:

```javascript
const { z } = require('zod');

const SETTINGS_SCHEMA_VERSION = 1;

const settingsRegistry = [
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
    validator: z.string().url(),
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
    description: 'Additional JSON config sent with model prompts',
    type: 'json',
    default: { temperature: 0.7 },
    tags: ['ollama', 'advanced'],
    group: ['Providers', 'Ollama'],
    scope: 'global',
    advanced: true,
    validator: z.record(z.any()),
    helpText: 'Keys: temperature, top_p, top_k, seed, etc.',
  },
];
```

---

### 1.2 Settings Store Interface & Implementation

#### [NEW] [settings-store.interface.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/settings/settings-store.interface.js)

Following the `ISecretStore` pattern:

```javascript
class ISettingsStore {
  async get(key, scope = {}) { throw new Error('Not implemented'); }
  async set(key, value, scope = {}) { throw new Error('Not implemented'); }
  async delete(key, scope = {}) { throw new Error('Not implemented'); }
  async getAll(scope = {}) { throw new Error('Not implemented'); }
}
```

#### [NEW] [mongodb-settings-store.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/settings/mongodb-settings-store.js)

MongoDB implementation with inline Mongoose schema (like `PlaintextInsecureNightmareSecretStore`):

- Schema: `{ key, value (mixed type), userId?, updatedAt }`
- Methods: `get`, `set`, `delete`, `getAll`

---

### 1.3 Settings Service

#### [NEW] [settings.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/settings/settings.service.js)

Core service with:
- `get(key)` - Returns current value (from store or default)
- `set(key, value)` - Validates with Zod, then stores
- `getAll()` - Returns all settings with current values
- `reset(key)` - Deletes stored value, reverts to default
- `resetAll()` - Deletes all stored settings
- `validate(key, value)` - Runs Zod validator, returns errors
- `getDefinition(key)` - Gets registry metadata
- `getAllDefinitions()` - Gets full registry for UI
- `exportSettings()` - Exports JSON with schema version
- `importSettings(data)` - Imports with migration support

---

### 1.4 Controller & Routes

#### [NEW] [settings.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/settings.controller.js)

Following existing controller pattern (`tool.controller.js`):

| Endpoint | Handler | Description |
|----------|---------|-------------|
| `GET /api/settings` | `getAllSettings` | All values + definitions |
| `GET /api/settings/definitions` | `getDefinitions` | Registry only (for UI rendering) |
| `GET /api/settings/:key` | `getSetting` | Single setting value |
| `PUT /api/settings/:key` | `updateSetting` | Update with validation |
| `DELETE /api/settings/:key` | `resetSetting` | Reset to default |
| `POST /api/settings/export` | `exportSettings` | Export JSON |
| `POST /api/settings/import` | `importSettings` | Import JSON |
| `POST /api/settings/reset-all` | `resetAllSettings` | Factory reset |

#### [NEW] [settings.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/settings.routes.js)

Standard Express router mapping to controller.

#### [app.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/app.js)

- Add `app.use('/api/settings', settingsRoutes);`

---

## Phase 2: Frontend

### 2.1 Settings Service (Angular)

#### [NEW] [settings.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/settings.service.ts)

API client service:
- `getAll()` - Fetch all settings
- `getDefinitions()` - Fetch registry
- `update(key, value)` - Update setting
- `reset(key)` - Reset single setting
- `resetAll()` - Factory reset
- `export()` / `import(data)` - Export/import

---

### 2.2 Settings Page Component

#### [NEW] [settings/](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/settings/)

Create new feature folder with:
- `settings-page.component.ts` - Main page with hybrid layout
- `settings-sidebar.component.ts` - Collapsible group tree
- `settings-search-results.component.ts` - Flat filtered list
- `setting-editor.component.ts` - Polymorphic editor
- `setting-editors/` - Type-specific editors (string, number, boolean, enum, json)

Key features:
- Sidebar navigation (default view)
- Flat list on search
- Auto-save with 500ms debounce
- Validation error styling (red border/background)
- Advanced settings toggle

---

### 2.3 Routing & Header Integration

#### [app.routes.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/app.routes.ts)

Add Settings route:
```typescript
{
  path: 'settings',
  loadComponent: () => import('./features/settings/settings-page.component')
    .then(m => m.SettingsPageComponent)
}
```

#### [header.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/layout/header.component.ts)

Wire ⚙️ button to navigate to `/settings`.

---

## Verification Strategy

### Automated Tests

#### [NEW] [settings.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/services/settings/settings.service.test.js)

Following pattern from `secret-store.test.js`:

**Test Cases:**
1. Registry parsing and definition retrieval
2. Get setting returns default when not stored
3. Set validates with Zod and rejects invalid values
4. Set stores valid values
5. Reset deletes stored value
6. ResetAll clears all settings
7. Export includes schema version
8. Import with migration support

**Command to run:**
```bash
cd backend && npm test -- --testPathPattern=settings
```

---

### Manual Testing

After implementation, verify manually in browser:

1. **Navigate to Settings**: Click ⚙️ in header → verify `/settings` loads
2. **Default View**: Sidebar with "Providers > Ollama" group visible
3. **Search View**: Type "context" → sidebar disappears, flat list shows matching settings
4. **Edit Setting**: Change Context Length to 8192 → verify auto-saves (no save button)
5. **Validation Error**: Set Context Length to 500 → verify red styling and error message
6. **Reset Setting**: Click ↺ on Context Length → verify returns to 4096
7. **Advanced Toggle**: Check "Show Advanced" → verify Model Options appears
8. **Export/Import**: Export, modify, re-import → verify settings change

---

## Implementation Order

1. Backend: Registry + ISettingsStore interface
2. Backend: MongoDBSettingsStore implementation
3. Backend: SettingsService
4. Backend: Controller + Routes
5. Backend: Unit tests
6. Frontend: Settings service
7. Frontend: Settings page component (basic)
8. Frontend: Sidebar navigation
9. Frontend: Search + flat list
10. Frontend: Type-specific editors
11. Frontend: Validation styling
12. Frontend: Reset + Export/Import
13. End-to-end manual testing

---

## Notes

- This is a large story (13 points). Consider breaking into sub-PRs if needed.
- Following existing patterns from `ISecretStore` and `tool.controller.js`
- Inline Mongoose schema (not separate model file) following secrets pattern
