# Experiment List UI Enhancements

Implement three related improvements to the experiment list and dashboard: sort RUNNING experiments to top with green background, add status filter buttons, and link dashboard's "Active Experiments" card to the filtered list.

## Proposed Changes

### Experiment List Component

#### [MODIFY] [experiment-list.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-list.component.ts)

1. **Import `ActivatedRoute`** to read query parameters
2. **Add status filter state**: `statusFilter: string | null = null`
3. **Add filter buttons UI** above the table with buttons for: All, RUNNING, COMPLETED, FAILED, PAUSED, STOPPED
4. **Sort experiments**: RUNNING experiments sorted to top, then by chronological order
5. **Add green background tint** to RUNNING experiment rows using `bg-green-50` class
6. **Read `?status=X` query param on init** to pre-filter the list
7. **Add `filteredExperiments` getter** that filters by status when set

---

### Dashboard Component

#### [MODIFY] [dashboard.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/dashboard/dashboard.component.ts)

1. **Make the "Active Experiments" card clickable** when count > 0
2. **Link to `/experiments?status=RUNNING`** using `routerLink` with `queryParams`
3. **Add hover styles** to indicate clickability

## Verification Plan

### Manual Verification

1. Navigate to `http://localhost:4200/experiments`
2. Verify RUNNING experiments appear at top with green-tinted rows
3. Click each filter button and verify only matching experiments show
4. Navigate to `http://localhost:4200/experiments?status=RUNNING` directly and verify only RUNNING experiments show
5. Go to Dashboard, verify "Active Experiments" card links to `/experiments?status=RUNNING` when count > 0
