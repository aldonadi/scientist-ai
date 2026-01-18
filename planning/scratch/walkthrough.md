# Walkthrough - Add Plan Link to Experiment Monitor

## Changes

### Experiment Monitor Component

I updated `ExperimentMonitorComponent` to display the name of the associated `ExperimentPlan` in the header.

#### `experiment-monitor.component.ts`

-   **Dependencies**: Injected `PlanService` to fetch plan details.
-   **Logic**: Added `loadPlan` method which is called during `loadExperiment` if the experiment has a `planId`.
-   **Template**: Added a specific section in the header to show the plan name with a `routerLink` to the plan editor.

```typescript
// experiment-monitor.component.ts

// ... imports
import { PlanService } from '../../core/services/plan.service';

// ... component decorator
@Component({
  // ...
  imports: [CommonModule, RouterLink, LogFeedComponent, JsonTreeComponent], // Added RouterLink
  template: \`
    <!-- ... -->
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>{{ id }}</span>
              <span *ngIf="planName" class="text-gray-300">|</span>
              <a *ngIf="planName" 
                 [routerLink]="['/plans', experiment?.planId]" 
                 class="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer">
                {{ planName }}
              </a>
            </div>
    <!-- ... -->
  \`
})
export class ExperimentMonitorComponent implements OnInit, OnDestroy {
  // ...
  planName?: string;

  constructor(
    // ...
    private planService: PlanService
  ) { }

  // ...

  loadExperiment(): void {
    // ...
    this.experimentService.getExperiment(this.id).subscribe({
      next: (exp) => {
        this.experiment = exp;
        if (!this.planName && exp.planId) {
          this.loadPlan(exp.planId);
        }
      },
      // ...
    });
  }

  loadPlan(planId: string): void {
    this.planService.getPlan(planId).subscribe({
      next: (plan) => {
        this.planName = plan.name;
      },
      // ...
    });
  }
}
```

## Verification Results

### Automated Tests
-   Ran `npm run build` in `frontend` directory.
-   **Result**: Build completed successfully!

### Manual Verification
-   **Action**: Navigate to an Experiment Monitor page.
-   **Expectation**: See the Plan Name (e.g., "My Experiment Plan") next to the Experiment ID in the header.
-   **Action**: Click the Plan Name.
-   **Expectation**: Navigate to the Plan Editor for that plan.
