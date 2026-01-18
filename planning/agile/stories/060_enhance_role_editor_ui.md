---
description: Enhance Role Editor UI
story_points: 3
---

# Story 060: Enhance Role Editor UI

## Background
The Role Editor UI in the Plan Editor needs several usability improvements to make it more intuitive and powerful for users configuring agent roles.

## Requirements

### 1. Rename 'Test' Button
- Rename the existing "Test" button (next to the provider dropdown) to **"Fetch Models"** to better reflect its function of retrieving the model list.

### 2. Implement 'Test Model' Feature
- Add a new **"Test Model"** button next to the Model input/dropdown.
- When clicked, this should perform a single-shot inference on the backend using the selected Provider and Model.
- Display a status indicator:
    - **Testing...** (loading spinner)
    - **Connection successful!** (Green text)
    - **Connection failed: [Error Message]** (Red text)
- The test should send a simple prompt (e.g., "Hello") and expect a response. Non-streaming is acceptable for this test.

### 3. Layout Improvements
- Ensure the "Switch to Manual Input" link remains positioned underneath the dropdown, not displaced by the new "Test Model" button.

### 4. Sort Model list
- The list of models retrieved from the provider should be sorted alphabetically to easier searching.

## Acceptance Criteria
- [ ] "Fetch Models" button is clearly labeled and functional.
- [ ] "Test Model" button triggers a real backend inference.
- [ ] Success/Error states for the model test are clearly visible.
- [ ] Model dropdown list is sorted alphabetically.
- [ ] "Switch to Manual Input" link is correctly positioned.
