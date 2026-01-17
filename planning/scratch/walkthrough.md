# Walkthrough: Reliability & Model Management Improvements

## Overview
This update addresses critical stability bugs and adds key features for experiment reliability and usability.

## Fixes Implemented

### 1. Role Persistence
**Issue**: Editing roles (e.g., changing models or tools) failed to save with `400 Bad Request`.
**Cause**: The backend was populating tool objects in the plan response, but the frontend expected tool IDs. This caused validation errors on save.
**Fix**: Removed `.populate('roles.tools')` from `PlanController.getPlan`. The Editor now receives and saves tool IDs correctly.

### 2. Experiment Control (Resume)
**Issue**: Clicking "Resume" could start duplicate orchestrators if clicked rapidly, leading to race conditions.
**Fix**: Updated `ExperimentController.controlExperiment` to check `OrchestratorRegistry`. If an orchestrator is already active, it simply updates the status to `RUNNING` without starting a new instance.

## New Features

### 1. Inference Retries
**Goal**: Prevent experiment failure due to transient model errors or timeouts.
**Implementation**:
- Added `maxStepRetries` to `ExperimentPlan` schema (Default: 3).
- Updated `ExperimentOrchestrator` to catch inference errors.
- **Logic**: If a `5xx` or other error occurs during `ProviderService.chat`:
  - Retries up to `maxStepRetries` times with exponential backoff.
  - Logs warning event for each retry.
  - Only fails the experiment if all retries fail.

### 2. Model List & Connection Test
**Goal**: Simplify model selection and verify provider connectivity.
**Implementation**:
- **Backend**: Added `GET /api/providers/:id/models` endpoint.
- **Frontend**:
  - Added "Test" button to Roles tab.
  - Clicking "Test" validates the connection and fetches available models.
  - Model input transforms into a Dropdown for easy selection.

### Role Editor Enhancements (Story 060)
**Goal**: Improve usability of the Role Editor.
**Implementation**:
- **Rename**: "Test" button -> "Fetch Models".
- **Test Model**: Added a new button to perform a live inference test with the selected model.
- **Sorting**: Model dropdown now sorts alphabetically.
- **Layout**: Fixed positioning of "Switch to Manual Input".

## Verification

### Role Persistence
Verified via valid save flow:
![Save Success](file:///home/andrew/.gemini/antigravity/brain/9eedb052-a975-46c9-b043-612e0d79e354/.system_generated/click_feedback/click_feedback_1768665502922.png)

### Model List UI & Test Feature
Verified "Fetch Models", Dropdown population, and "Test Model" success:
![Fetch Models](file:///home/andrew/.gemini/antigravity/brain/9eedb052-a975-46c9-b043-612e0d79e354/.system_generated/click_feedback/click_feedback_1768676803062.png)
![Test Model Success](file:///home/andrew/.gemini/antigravity/brain/9eedb052-a975-46c9-b043-612e0d79e354/.system_generated/click_feedback/click_feedback_1768677083076.png)
