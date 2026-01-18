# Experiment List UI Enhancements

Implementation of three UI improvements for better experiment visibility and filtering.

## Changes Made

### [experiment-list.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-list.component.ts)

- **Status filter buttons**: Added buttons for All, RUNNING, COMPLETED, FAILED, PAUSED, STOPPED
- **RUNNING prioritization**: Experiments sorted with RUNNING at top, then by startTime descending
- **Green background**: RUNNING rows have `bg-green-50` tint for visibility
- **Query param support**: Filter pre-selects from `?status=X` URL param

### [dashboard.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/dashboard/dashboard.component.ts)

- **Clickable card**: "Active Experiments" card links to `/experiments?status=RUNNING` when count > 0
- **Visual cue**: Shows "Click to view →" text when there are active experiments

## Screenshots

### Experiments List with Filter Buttons

![Experiments list showing filter buttons and status badges](/home/andrew/.gemini/antigravity/brain/c292b042-8b11-430d-82b5-ec4546b7b0bd/experiments_list_all_1768701537857.png)

### Dashboard with Clickable Active Experiments Card

![Dashboard showing Active Experiments card with "Click to view" text](/home/andrew/.gemini/antigravity/brain/c292b042-8b11-430d-82b5-ec4546b7b0bd/.system_generated/click_feedback/click_feedback_1768701578395.png)

## Demo Recording

![Browser demo of filter functionality](/home/andrew/.gemini/antigravity/brain/c292b042-8b11-430d-82b5-ec4546b7b0bd/experiments_filter_demo_1768701530254.webp)
