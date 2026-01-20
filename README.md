# Scientist.ai

An agentic AI experiment platform built with the MEAN stack (MongoDB, Express, Angular, Node.js).

## Prerequisites

- **Node.js** v20+
- **MongoDB** v6+ (local or remote)
- **npm** v9+

## Project Structure

```
scientist-ai/
├── backend/          # Node.js/Express REST API
├── frontend/         # Angular 17 application
└── planning/         # Specifications and agile stories
```

---

## Backend

### Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/scientist-ai
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | Required |
| `LOG_LEVEL` | Logging verbosity (DEBUG, INFO, WARN, ERROR) | `INFO` |

### Starting the Backend

```bash
cd backend

# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000/api`

### Health Check

```bash
curl http://localhost:3000/api/health
```

---

## Frontend

### Configuration

The frontend connects to the backend API. Configuration is in:
- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts` or `src/assets/config.json`

Default API URL: `http://localhost:3000/api`

### Starting the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm start
```

The app will be available at `http://localhost:4200`

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

Uses Jest with `mongodb-memory-server` for isolated database testing.

### Frontend Tests

```bash
cd frontend
npm test
```

Uses Jasmine + Karma for unit and component tests.

---

## Quick Start

1. **Start MongoDB** (if running locally):
   ```bash
   mongod --dbpath /path/to/data
   ```

2. **Start Backend**:
   ```bash
   cd backend && npm install && npm run dev
   ```

3. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend && npm install && npm start
   ```

4. Open `http://localhost:4200` in your browser.

---

## How to Run: Lemonade Stand Simulation

This repository includes a sophisticated "Lemonade Stand" simulation designed to test complex agent behaviors, environment variable management, and tool usage.

### 1. Create Tools
The simulation relies on a set of tools in the `lemonade_stand` namespace. These should be created first.
- **Tools**: `purchase_lemons`, `purchase_cups`, `purchase_sugar`, `purchase_ice`, `set_advertised_drink_price`, `sell_lemonade`, `mix_lemonade`, `write_journal_entry`, `take_loan`, `repay_loan`.

### 2. Create Experiment Plan
Create a new Experiment Plan with the following configuration:
- **Environment**: Initialize `cash_on_hand` (50), `loan_balance` (0), inventory counts, `journal` array [], and `stats` object {}.
- **Role**: "Lemonade Stand Operator" with the `lemonade_stand` tools and access to relevant environment variables via the whitelist.
- **Goals**: 
  - **Success**: `env.stats.current_net_worth >= 1000`
  - **Failure**: `env.cash_on_hand <= 0 and env.loan_balance >= 200`
- **Scripts**: 
  - `STEP_START`: Handle ice melting, calculating customers based on price, and accruing loan interest.
  - `STEP_END`: Update net worth statistics.

### 3. Run Experiment
Go to the **Plans** page in the frontend (http://localhost:4200/plans) and click **Run** on the "Lemonade Stand Simulation" plan.
Monitor the `stats` environment variable in the **Experiment Monitor** to watch the agent's progress!

---

## Settings System

The application uses a centralized settings system with a registry-based architecture. Settings are defined in code, validated with Zod schemas, and stored in MongoDB.

### Adding a New Setting

To add a new configuration option, you only need to modify **one file**:

**File:** `backend/src/services/settings/settings.registry.js`

Add a new object to the `settingsRegistry` array:

```javascript
{
    key: 'providers.openai.apiKey',           // Unique dot-notation key
    name: 'API Key',                          // Display name in UI
    description: 'OpenAI API key for authentication',
    type: 'string',                           // See "Supported Types" below
    default: '',                              // Default value
    tags: ['openai', 'authentication', 'api'], // Searchable tags
    group: ['Providers', 'OpenAI'],           // UI navigation hierarchy
    scope: 'global',                          // 'global' or 'user'
    advanced: false,                          // Hide under "Show Advanced"?
    validator: z.string().min(1, 'Required'), // Zod validation schema
    helpText: 'Get your key at platform.openai.com',  // Optional tooltip
}
```

That's it! The setting will automatically:
- Appear in the Settings UI under Providers → OpenAI
- Be searchable by name, description, tags, and group
- Validate input according to the Zod schema
- Persist in MongoDB
- Support export/import

### Supported Data Types

| Type | UI Control | Example Default | Notes |
|------|------------|-----------------|-------|
| `string` | Text input | `'http://localhost'` | For URLs, paths, API keys |
| `integer` | Number input (step=1) | `4096` | Whole numbers only |
| `float` | Number input (step=0.01) | `0.7` | Decimal numbers |
| `boolean` | Toggle switch | `true` | On/off settings |
| `enum` | Dropdown select | `'medium'` | Requires `options` array |
| `json` | Textarea (JSON) | `{ temperature: 0.7 }` | For complex config objects |

#### Enum Example
```javascript
{
    key: 'logging.level',
    type: 'enum',
    default: 'info',
    options: ['debug', 'info', 'warn', 'error'],  // Required for enum
    validator: z.enum(['debug', 'info', 'warn', 'error']),
    // ...other fields
}
```

### Validation Rules (Zod)

The `validator` field accepts any Zod schema. Common patterns:

```javascript
// String validations
z.string().min(1, 'Required')
z.string().url('Must be a valid URL')
z.string().email('Must be a valid email')
z.string().regex(/^[a-z]+$/, 'Lowercase letters only')

// Number validations
z.number().int('Must be an integer')
z.number().min(0, 'Must be non-negative')
z.number().max(100, 'Maximum is 100')
z.number().positive('Must be positive')

// Combined validations
z.number().int().min(1).max(10000)

// JSON object validation
z.record(z.any()).refine(
    (obj) => typeof obj === 'object' && obj !== null,
    { message: 'Must be a valid JSON object' }
)

// Enum validation
z.enum(['option1', 'option2', 'option3'])

// Boolean (no validation needed, type enforces it)
z.boolean()
```

### Metadata Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | ✓ | Unique identifier in dot notation (`category.subcategory.name`) |
| `name` | string | ✓ | Human-readable display name |
| `description` | string | ✓ | Short description shown below the setting |
| `type` | string | ✓ | One of: `string`, `integer`, `float`, `boolean`, `enum`, `json` |
| `default` | any | ✓ | Default value (must match type) |
| `tags` | string[] | ✓ | Searchable keywords |
| `group` | string[] | ✓ | Hierarchy path for UI navigation (e.g., `['Providers', 'Ollama']`) |
| `scope` | string | ✓ | `'global'` (system-wide) or `'user'` (per-user, future feature) |
| `advanced` | boolean | ✓ | If `true`, hidden unless "Show Advanced" is checked |
| `validator` | ZodSchema | ✓ | Zod schema for validation |
| `options` | string[] | enum only | Allowed values for enum type |
| `helpText` | string | - | Extended help tooltip |

### Best Practices for Discoverability

**Key Naming:**
- Use dot notation: `category.subcategory.settingName`
- Keep keys lowercase with camelCase for the final segment
- Examples: `providers.ollama.apiBaseUrl`, `ui.theme.darkMode`

**Tags:**
- Include the provider/feature name: `['ollama', 'openai']`
- Include the function: `['connection', 'performance', 'security']`
- Include synonyms users might search: `['url', 'endpoint', 'address']`
- 3-5 tags per setting is ideal

**Groups:**
- First level: Major category (`Providers`, `UI`, `Security`, `Logging`)
- Second level: Specific feature (`Ollama`, `OpenAI`, `Theme`)
- Keep hierarchy shallow (2 levels recommended, 3 max)

**Descriptions:**
- Keep under 80 characters
- Describe *what* it does, not *how* to use it
- Use `helpText` for extended guidance

### Example: Adding OpenAI Provider Settings

```javascript
// === PROVIDERS > OPENAI ===
{
    key: 'providers.openai.apiKey',
    name: 'API Key',
    description: 'Your OpenAI API key for authentication',
    type: 'string',
    default: '',
    tags: ['openai', 'authentication', 'api', 'key'],
    group: ['Providers', 'OpenAI'],
    scope: 'global',
    advanced: false,
    validator: z.string().min(1, 'API key is required'),
    helpText: 'Get your API key at https://platform.openai.com/api-keys',
},
{
    key: 'providers.openai.model',
    name: 'Default Model',
    description: 'Default model to use for completions',
    type: 'enum',
    default: 'gpt-4o',
    options: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    tags: ['openai', 'model', 'llm'],
    group: ['Providers', 'OpenAI'],
    scope: 'global',
    advanced: false,
    validator: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']),
},
{
    key: 'providers.openai.maxTokens',
    name: 'Max Tokens',
    description: 'Maximum tokens in completion response',
    type: 'integer',
    default: 4096,
    tags: ['openai', 'tokens', 'limit', 'performance'],
    group: ['Providers', 'OpenAI'],
    scope: 'global',
    advanced: true,
    validator: z.number().int().min(1).max(128000),
},
```

