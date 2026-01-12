# Walkthrough - Duplicate Experiment Plan Endpoint (Story 053)

I have implemented the `POST /api/plans/:id/duplicate` endpoint, allowing users to clone existing Experiment Plans.

## Changes

### 1. Backend Controller (`plan.controller.js`)
- Added `duplicatePlan` method.
- Implemented deep copying of Plan, Roles, Goals, and Scripts.
- Implemented name collision resolution:
    - Appends ` (Copy)` to the first copy.
    - Appends ` (Copy N)` for subsequent copies (e.g., `My Plan (Copy 2)`).
- Included safety checks for maximum copies (limit 10) to prevent infinite loops.

### 2. Backend Routes (`plan.routes.js`)
- Registered `POST /:id/duplicate`.

## Verification Results

### Automated Tests (`backend/tests/api/plan.routes.test.js`)
I added comprehensive integration tests covering:
- **Success Case**: Duplicating a plan creates a new ID and expected name.
- **Name Collision**: Verified `(Copy 2)` generation.
- **Custom Name**: Verified providing a custom name in the body.
- **Error Handling**: Verified 404 for missing source plan.

**Test Output:**
```
 PASS  tests/api/plan.routes.test.js
 ...
    POST /api/plans/:id/duplicate 
      ✓ should duplicate a plan with a new name (35 ms)
      ✓ should handle name collisions by incrementing suffix (51 ms)
      ✓ should allow providing a custom name (29 ms)
      ✓ should return 404 if source plan not found (17 ms)
```

## Usage Example
```bash
# Duplicate a plan
curl -X POST http://localhost:3000/api/plans/69646d03ac0946ca94b0eac5/duplicate

# Response
{
  "_id": "69646d03ac0946ca94b0eac6",
  "name": "My Plan (Copy)",
  ...
}
```
