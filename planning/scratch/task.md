# Task: Implement Logs API (Story 049)

## Checklist

- [x] Update backlog status to IN-PROGRESS
- [ ] Implement `getExperimentLogs` controller method
  - [ ] Validate experiment exists (404 if not)
  - [ ] Query logs by experimentId
  - [ ] Support `?step=N` filter
  - [ ] Support `?source=<string>` filter
  - [ ] Support pagination (`?limit=N&offset=M`)
  - [ ] Return logs in chronological order (oldest first)
  - [ ] Include `data` field only when present
- [ ] Add route `GET /api/experiments/:id/logs`
- [ ] Write unit tests
  - [ ] Returns logs array for valid experiment
  - [ ] Returns 404 for non-existent experiment
  - [ ] Step filter works correctly
  - [ ] Source filter works correctly
  - [ ] Pagination works correctly
  - [ ] Logs returned in chronological order
  - [ ] Returns empty array for experiment with no logs
  - [ ] Invalid ObjectId format returns 400
- [ ] Mark story checkboxes as complete
- [ ] Update backlog status to REVIEW
