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
