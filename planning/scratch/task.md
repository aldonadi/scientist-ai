# UI Enhancement Tasks

## Completed

- [x] Add toast notifications to save operations
  - [x] Tool editor - added success/error toasts
  - [x] Plan editor - already has toasts

- [x] Fix unsaved changes workflow in Plan Editor
  - [x] Created ConfirmService for custom modal dialogs
  - [x] Created ConfirmDialogComponent with styled modal UI
  - [x] Cancel button shows "Discard Changes?" modal
  - [x] Navigation guard shows "Unsaved Changes" modal  
- [x] **Experiments List Enhancements:**
  - [x] Replace "Plan ID" with "Experiment Plan Name"
  - [x] Reorder columns
  - [x] Update RUNNING badge
  - [x] Add STEP column
  - [x] Fix "Last Run" field
  - [x] Implement Batch Run features
- [x] **Configurable Safety Limits:**
  - [x] Add `maxStepRetries` input to `GeneralTabComponent`
  - [x] Update `PlanEditorComponent` to handle `maxStepRetries`
  - [x] Verify validation and saving

- [x] Add unsaved changes workflow to Tool Editor
  - [x] Added dirty checking (saveInitialState, isDirty)
  - [x] Added "● Unsaved Changes" badge in header
  - [x] Cancel button shows "Discard Changes?" modal
  - [x] Navigation guard shows "Unsaved Changes" modal
  - [x] Added canDeactivate guard to routes

## Pending

- [ ] Add toasts to delete and duplicate operations
