---
description: Fix Plan Save & Add Dirty Check
story_points: 3
---

# Story 061: Fix Plan Save & Add Dirty Check

## Background
Users have reported that saving an Experiment Plan does not reliably persist changes. Additionally, the user experience is lacking feedback (toasts) and safety mechanisms (dirty check on exit).

## Requirements

### 1. Fix Save Functionality
- Investigate and ensure that the "Save" button correctly persists changes to the backend for both Create and Update operations.
- Ensure all fields (General, Environment, Roles, Goal, Scripts) are included in the payload.

### 2. Toast Notifications
- Replace the immediate redirection on success with a **Toast Notification** saying "Experiment Plan Saved Successfully".
- Show an error Toast (or keep alert if Toast not viable) on failure.
- Redirect after a short delay or allow user to stay on page? User said "Experiment Plan Saved Successfully" toast. Usually implies we might stay or redirect. The current behavior redirects. Let's redirect *and* show toast, or show toast *then* redirect. The user request didn't strictly say "don't redirect", but "doesn't actually save". If it redirects, user might assume it saved.
- *Refinement*: User said "It looks like clicking ... doesn't actually save anything". This implies they go back to list, open it again, and changes are gone.

### 3. Dirty State Check (Unsaved Changes Guard)
- Detect if the plan has been modified since load.
- When navigating away (route change), if dirty, prompt: "Are you sure you want to leave without saving changes to the '$plan_name' Experiment Plan?"
- Allow confirming (leave) or cancelling (stay).

## Acceptance Criteria
- [ ] Changes to a Plan are reliably saved to the database.
- [ ] "Experiment Plan Saved Successfully" toast appears on success.
- [ ] Navigation away with unsaved changes triggers a confirmation prompt.
