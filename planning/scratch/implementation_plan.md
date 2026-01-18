# Lemonade Stand Experiment Implementation Plan

## Overview
Create a full simulation of a young entrepreneur running a lemonade stand. An AI agent manages purchasing, inventory, pricing, and sales to reach $1000 net worth before 2000 steps.

---

## 1. Tools (Namespace: `lemonade_stand`)

| Tool Name | Arguments | Description |
|-----------|-----------|-------------|
| `purchase_lemons` | `qty: int` | Buy lemons at $0.25 each |
| `purchase_cups` | `qty: int` | Buy drinking cups at $0.10 each |
| `purchase_sugar` | `qty_cups: int` | Buy sugar at $0.50 per cup |
| `purchase_ice` | `qty_servings: int` | Buy ice at $0.15 per serving |
| `set_advertised_drink_price` | `new_price: float` | Set lemonade price |
| `sell_lemonade` | (none) | Sell drinks to waiting customers |
| `mix_lemonade` | (none) | Mix up to 10 drinks from ingredients |
| `write_journal_entry` | `entry: str` | Add journal entry |
| `take_loan` | `amount: float` | Borrow money (max $200 total) |
| `repay_loan` | `amount: float` | Repay loan balance |

---

## 2. Environment Variables

### Core State
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `cash_on_hand` | float | 50.00 | Current cash |
| `loan_balance` | float | 0.00 | Outstanding loan |
| `num_lemons` | int | 1 | Raw lemons |
| `num_cups` | int | 0 | Drinking cups |
| `cups_of_sugar` | int | 0 | Sugar cups |
| `num_ice_servings` | int | 0 | Ice servings |
| `num_lemonade_drinks` | int | 0 | Ready drinks |
| `advertised_drink_price` | float | 1.50 | Price per drink |
| `num_customers_this_turn` | int | 1 | Customers waiting |
| `journal` | array | [] | Journal entries |

### Statistics (Object)
| Field | Default | Description |
|-------|---------|-------------|
| `num_transactions` | 0 | Lemonades sold |
| `num_lemons_bought` | 0 | Total lemons purchased |
| `num_sugar_bought` | 0 | Total sugar cups purchased |
| `num_cups_bought` | 0 | Total cups purchased |
| `num_ice_bought` | 0 | Total ice purchased |
| `num_drinks_mixed` | 0 | Drinks mixed |
| `num_customers_encountered` | 0 | Total customers |
| `total_interest_accrued` | 0.00 | Interest paid |
| `current_net_worth` | 50.00 | Cash - Loan |
| `max_net_worth` | 50.00 | Highest net worth |
| `min_net_worth` | 50.00 | Lowest net worth |

---

## 3. Goals

1. **Success**: `env.stats.current_net_worth >= 1000`
   - Description: "Reached $1000 net worth! Business Success!"

2. **Failure**: `env.cash_on_hand <= 0 and env.loan_balance >= 200`
   - Description: "Bankruptcy - No cash and max loan reached"

---

## 4. Role: Lemonade Stand Operator

**System Prompt**:
```
You are an ambitious young entrepreneur running a lemonade stand. Your goal is to grow your business from $50 to $1000 net worth.

**Your Resources:**
- Cash, inventory (lemons, cups, sugar, ice), and ready-to-serve lemonade drinks
- You can take out loans up to $200 but be careful - 1% interest accrues each turn!

**Your Tools:**
- Purchase raw materials (lemons $0.25, cups $0.10, sugar $0.50/cup, ice $0.15/serving)
- Mix lemonade (uses 1 of each: lemon, cup, sugar, ice → 1 drink)
- Set your drink price (affects customer demand)
- Sell lemonade to waiting customers
- Manage loans (take/repay)
- Write journal entries about your strategy and feelings

**Strategy Tips:**
- Each drink costs ~$1.00 in materials
- Lower prices attract more customers (3-6 typical at fair price)
- Ice melts! 1 serving lost per turn
- Balance inventory - don't overbuy perishables

Think carefully, maximize profit, avoid bankruptcy, and document your journey!
```

---

## 5. Scripts

### STEP_START (Beginning of Turn)
```python
import random

# Ice melts
if env.get('num_ice_servings', 0) > 0:
    env['num_ice_servings'] = max(0, env['num_ice_servings'] - 1)

# Calculate customers based on price (optimal ~$1.00-$2.00)
price = env.get('advertised_drink_price', 1.50)
base_customers = 5  # Sweet spot at $1.50

if price <= 0.50:
    base_customers = 12  # Very cheap = lots of customers
elif price <= 1.00:
    base_customers = 8
elif price <= 1.50:
    base_customers = 5
elif price <= 2.00:
    base_customers = 3
elif price <= 3.00:
    base_customers = 1
else:
    base_customers = 0  # Too expensive

# Add random variation (-2 to +3)
variation = random.randint(-2, 3)
customers = max(0, min(15, base_customers + variation))
env['num_customers_this_turn'] = customers

# Track total customers
stats = env.get('stats', {})
stats['num_customers_encountered'] = stats.get('num_customers_encountered', 0) + customers

# Accrue loan interest (1% per turn)
loan = env.get('loan_balance', 0)
if loan > 0:
    interest = round(loan * 0.01, 2)
    env['loan_balance'] = round(loan + interest, 2)
    stats['total_interest_accrued'] = round(stats.get('total_interest_accrued', 0) + interest, 2)

env['stats'] = stats
```

### STEP_END (End of Turn)
```python
# Update net worth statistics
cash = env.get('cash_on_hand', 0)
loan = env.get('loan_balance', 0)
net_worth = round(cash - loan, 2)

stats = env.get('stats', {})
stats['current_net_worth'] = net_worth
stats['max_net_worth'] = max(stats.get('max_net_worth', net_worth), net_worth)
stats['min_net_worth'] = min(stats.get('min_net_worth', net_worth), net_worth)
env['stats'] = stats
```

---

## 6. Execution Order

1. **Create Tools** (10 tools in `lemonade_stand` namespace)
2. **Create Experiment Plan**:
   - Set environment variables
   - Add Role with all tools assigned
   - Add Goals
   - Add Scripts
3. **Run Experiment** (max 2000 steps)
4. **Monitor** progress via UI

---

## 7. Browser Automation Steps

### Phase 1: Create Tools
Navigate to Tools page, create each tool with proper Python code.

### Phase 2: Create Plan
1. Navigate to Plans → New Plan
2. Fill General tab (name, description, max steps = 2000)
3. Fill Environment tab with all variables
4. Fill Roles tab (one role with system prompt)
5. Fill Goals tab (success and failure conditions)
6. Fill Scripts tab (STEP_START and STEP_END hooks)
7. Save Plan

### Phase 3: Run Experiment
1. Navigate to Plans list
2. Click Run on Lemonade Stand plan
3. Monitor execution
