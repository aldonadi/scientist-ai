import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { PlanService, ExperimentPlan, CreatePlanDto, Role, Goal, Script } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import { GeneralTabComponent } from './general-tab.component';
import { EnvironmentTabComponent } from './environment-tab.component';
import { RolesTabComponent } from './roles-tab.component';
import { GoalsTabComponent } from './goals-tab.component';
import { ScriptsTabComponent } from './scripts-tab.component';

@Component({
  selector: 'app-plan-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GeneralTabComponent,
    EnvironmentTabComponent,
    RolesTabComponent,
    GoalsTabComponent,
    ScriptsTabComponent
  ],
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <button (click)="goBack()" class="mr-4 text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? 'Create Plan' : 'Edit Plan: ' + plan.name }}
          </h1>
          <span *ngIf="isDirty()" class="ml-3 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
             ● Unsaved Changes
          </span>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Run / Batch / Delete (only for existing plans) -->
          <ng-container *ngIf="!isNew">
            <div class="flex mr-2">
              <button (click)="runPlan()" 
                      [disabled]="isDirty()"
                      [title]="isDirty() ? 'Save changes before running' : 'Run experiment'"
                      class="px-3 py-2 bg-green-600 text-white rounded-l-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Run
              </button>
              <button (click)="openBatchModal()" 
                      [disabled]="isDirty()"
                      [title]="isDirty() ? 'Save changes before batch run' : 'Batch run'"
                      class="px-3 py-2 bg-green-700 text-white rounded-r-lg text-sm font-medium hover:bg-green-800 transition-colors border-l border-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Batch
              </button>
            </div>
            <button (click)="deletePlan()" 
                    class="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
              Delete
            </button>
          </ng-container>
          <button (click)="goBack()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button (click)="save()" 
                  [disabled]="!isValid()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </div>
      
      <!-- Tab Bar -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex space-x-8">
          <button *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  class="py-3 px-1 border-b-2 font-medium text-sm transition-colors"
                  [class.border-blue-600]="activeTab === tab.id"
                  [class.text-blue-600]="activeTab === tab.id"
                  [class.border-transparent]="activeTab !== tab.id"
                  [class.text-gray-500]="activeTab !== tab.id"
                  [class.hover:text-gray-700]="activeTab !== tab.id">
            {{ tab.label }}
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <div class="flex-1 min-h-0">
        <!-- We use [class.hidden] instead of *ngIf to preserve component state across tab switches -->
        
        <app-general-tab 
          class="h-full block"
          [class.hidden]="activeTab !== 'general'"
          [(name)]="plan.name"
          [(description)]="plan.description"
          [(maxSteps)]="plan.maxSteps"
          [(maxStepRetries)]="plan.maxStepRetries">
        </app-general-tab>
        
        <app-environment-tab 
          class="h-full block"
          [class.hidden]="activeTab !== 'environment'"
          [(environment)]="plan.initialEnvironment"
          [roles]="plan.roles"
          (rolesChange)="plan.roles = $event">
        </app-environment-tab>
        
        <app-roles-tab 
          class="h-full block"
          [class.hidden]="activeTab !== 'roles'"
          [(roles)]="plan.roles"
          [providers]="providers"
          [environmentVars]="getEnvironmentVars()">
        </app-roles-tab>
        
        <app-goals-tab 
          class="h-full block"
          [class.hidden]="activeTab !== 'goals'"
          [(goals)]="plan.goals">
        </app-goals-tab>
        
        <app-scripts-tab 
          class="h-full block"
          [class.hidden]="activeTab !== 'scripts'"
          [(scripts)]="plan.scripts">
        </app-scripts-tab>
      </div>
    </div>
    
    <!-- Batch Run Modal -->
    <div *ngIf="showBatchModal" 
         class="fixed inset-0 z-[10000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelBatch()"></div>
      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Launch Batch Experiments</h3>
          <p class="text-sm text-gray-500 mt-1">Plan: {{ plan.name }}</p>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">How many experiments to launch?</label>
            <div class="flex items-center space-x-2">
              <button *ngFor="let n of [2, 5, 10, 20]"
                      (click)="batchCount = n"
                      [class]="batchCount === n 
                        ? 'px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium' 
                        : 'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50'">
                {{ n }}
              </button>
              <input type="number" 
                     [(ngModel)]="batchCount"
                     min="1"
                     max="100"
                     class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button (click)="cancelBatch()"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium">
            Cancel
          </button>
          <button (click)="confirmBatch()"
                  [disabled]="batchCount < 1"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Launch {{ batchCount }} Experiments
          </button>
        </div>
      </div>
    </div>
  `
})
export class PlanEditorComponent implements OnInit, CanComponentDeactivate {
  @Input() id?: string;

  // Access the child component to get full state (variables + types)
  @ViewChild(EnvironmentTabComponent) envTab!: EnvironmentTabComponent;

  isNew = true;
  activeTab = 'general';

  tabs = [
    { id: 'general', label: 'General' },
    { id: 'environment', label: 'Environment' },
    { id: 'roles', label: 'Roles' },
    { id: 'goals', label: 'Goals' },
    { id: 'scripts', label: 'Scripts' }
  ];

  providers: any[] = [];

  plan: {
    name: string;
    description: string;
    initialEnvironment: { [key: string]: any };
    roles: Role[];
    goals: Goal[];
    scripts: Script[];
    maxSteps: number;
    maxStepRetries: number;
  } = {
      name: '',
      description: '',
      initialEnvironment: {},
      roles: [],
      goals: [],
      scripts: [],
      maxSteps: 20,
      maxStepRetries: 3
    };

  // Snapshot of initial state for dirty check
  private initialPlanState: string = '';
  // Flag to bypass guard when user already confirmed via Cancel button
  private bypassGuard = false;

  // Batch modal state
  showBatchModal = false;
  batchCount = 5;

  constructor(
    private planService: PlanService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId && routeId !== 'new') {
      this.id = routeId;
      this.isNew = false;
      this.loadPlan();
    }
    this.fetchProviders();

    // Deep linking for tabs
    this.route.fragment.subscribe(fragment => {
      if (fragment && this.tabs.some(t => t.id === fragment)) {
        this.activeTab = fragment;
      }
    });
  }

  fetchProviders(): void {
    this.http.get<any[]>('/api/providers').subscribe({
      next: (data) => this.providers = data,
      error: (err) => console.error('Failed to load providers:', err)
    });
  }

  loadPlan(): void {
    if (!this.id) return;

    this.planService.getPlan(this.id).subscribe({
      next: (plan) => {
        this.plan = {
          name: plan.name,
          description: plan.description,
          initialEnvironment: plan.initialEnvironment ? plan.initialEnvironment['variables'] : {},
          roles: plan.roles || [],
          goals: plan.goals || [],
          scripts: plan.scripts || [],
          maxSteps: plan.maxSteps || 20,
          maxStepRetries: plan.maxStepRetries !== undefined ? plan.maxStepRetries : 3
        };
        this.saveInitialState();
      },
      error: (err) => {
        console.error('Failed to load plan:', err);
        this.router.navigate(['/plans']);
      }
    });
  }

  isValid(): boolean {
    return !!(this.plan.name && this.plan.description);
  }

  save(): void {
    // Transform payload for backend
    // Use the authoritative state from EnvironmentTabComponent if available
    const variables: { [key: string]: any } = {};
    const variableTypes: { [key: string]: string } = {};

    if (this.envTab && this.envTab.variables) {
      this.envTab.variables.forEach(v => {
        if (v.key && !v.keyError) {
          variables[v.key] = this.envTab.parseValue(v);
          variableTypes[v.key] = v.type;
        }
      });
    } else {
      // Fallback if tab component is not available (should not happen with hidden tabs, 
      // but strictly possible if not rendered yet)
      Object.entries(this.plan.initialEnvironment).forEach(([key, val]) => {
        variables[key] = val;
        // Simple type inference fallback
        variableTypes[key] = typeof val === 'object' ? (Array.isArray(val) ? 'array' : 'object') : typeof val;
        if (variableTypes[key] === 'number') variableTypes[key] = 'number'; // frontend uses 'number', backend maps it
      });
    }

    const payload: any = {
      name: this.plan.name,
      description: this.plan.description,
      maxSteps: this.plan.maxSteps,
      maxStepRetries: this.plan.maxStepRetries,
      initialEnvironment: {
        variables: variables,
        variableTypes: variableTypes
      },
      roles: this.plan.roles,
      scripts: this.plan.scripts,
      goals: this.plan.goals.map((g: any) => ({
        description: g.description,
        conditionScript: g.conditionScript || g.condition // Use conditionScript to match backend schema
      }))
    };

    console.log('[PlanEditor] Saving Plan Payload:', payload);

    const action = this.isNew
      ? this.planService.createPlan(payload)
      : this.planService.updatePlan(this.id!, payload);

    action.subscribe({
      next: (savedPlan) => {
        this.toastService.success('Experiment Plan Saved Successfully');
        // Update initial state to new saved state
        this.saveInitialState();

        // If it was new, we might want to navigate to the edit URL of the new plan, 
        // OR just go back. User story implies redirect is fine, but maybe we stay?
        // Let's stick to existing behavior (navigate back) but rely on the toast.
        // Wait, if we redirect immediately, the toast might be lost if it's not global per-se 
        // (but ToastService is root, and ToastComponent is in AppComponent, so it persists!)
        setTimeout(() => this.router.navigate(['/plans']), 500);
      },
      error: (err) => {
        console.error('Failed to save plan:', err);
        this.toastService.error('Failed to save plan: ' + (err.error?.message || err.message));
      }
    });
  }

  saveInitialState(): void {
    // We serialize the relevant parts of the plan to detect changes later.
    // NOTE: This simple JSON stringify comparison might have issues with order, 
    // but for simple plan structures it's usually "good enough".
    this.initialPlanState = JSON.stringify(this.getCleanPlanObject());
  }

  getCleanPlanObject(): any {
    // Return a clean object of the plan data, filtering out UI-specific stuff if any
    return {
      name: this.plan.name,
      description: this.plan.description,
      maxSteps: this.plan.maxSteps,
      maxStepRetries: this.plan.maxStepRetries,
      initialEnvironment: this.plan.initialEnvironment,
      roles: this.plan.roles,
      goals: this.plan.goals,
      scripts: this.plan.scripts
    };
  }

  isDirty(): boolean {
    const currentState = JSON.stringify(this.getCleanPlanObject());
    return this.initialPlanState !== currentState;
  }

  canDeactivate(): boolean | Promise<boolean> {
    // If we've already confirmed via goBack(), skip the guard
    if (this.bypassGuard) {
      return true;
    }
    if (this.isDirty()) {
      return this.confirmService.confirm({
        title: 'Unsaved Changes',
        message: `You have unsaved changes to "${this.plan.name}".\n\nDo you want to leave without saving?`,
        confirmText: 'Leave',
        cancelText: 'Stay'
      });
    }
    return true;
  }

  async goBack(): Promise<void> {
    if (this.isDirty()) {
      const shouldDiscard = await this.confirmService.confirm({
        title: 'Discard Changes?',
        message: `You have unsaved changes to "${this.plan.name}".\n\nDo you want to discard these changes?`,
        confirmText: 'Discard',
        cancelText: 'Keep Editing'
      });
      if (shouldDiscard) {
        // Set flag to bypass guard since user already confirmed
        this.bypassGuard = true;
        this.router.navigate(['/plans']);
      }
    } else {
      this.router.navigate(['/plans']);
    }
  }

  async revertChanges(): Promise<void> {
    if (this.isDirty()) {
      const shouldRevert = await this.confirmService.confirm({
        title: 'Revert Changes?',
        message: `Do you want to revert all unsaved changes to "${this.plan.name}"?`,
        confirmText: 'Revert',
        cancelText: 'Cancel'
      });
      if (shouldRevert) {
        if (this.isNew) {
          this.plan = {
            name: '',
            description: '',
            initialEnvironment: {},
            roles: [],
            goals: [],
            scripts: [],
            maxSteps: 20,
            maxStepRetries: 3
          };
          this.saveInitialState();
        } else {
          this.loadPlan();
        }
      }
    }
  }

  /**
   * Get environment variables as an array with key, type, and value info
   * for the Roles tab variable picker.
   */
  getEnvironmentVars(): { key: string; type: string; value: any }[] {
    if (this.envTab && this.envTab.variables) {
      return this.envTab.variables
        .filter(v => v.key && !v.keyError)
        .map(v => ({
          key: v.key,
          type: v.type,
          value: this.envTab.parseValue(v)
        }));
    }
    // Fallback: derive from the plan's initialEnvironment
    return Object.entries(this.plan.initialEnvironment || {}).map(([key, value]) => ({
      key,
      type: this.detectType(value),
      value
    }));
  }

  private detectType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }

  // --- Run / Batch / Delete Methods ---

  async runPlan(): Promise<void> {
    if (!this.id || this.isDirty()) return;

    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: this.id })
      });
      const exp = await response.json();

      this.toastService.success(`Experiment launched for "${this.plan.name}"`);
      this.router.navigate(['/experiments', exp._id]);
    } catch (err) {
      console.error('Failed to launch experiment:', err);
      this.toastService.error('Failed to launch experiment');
    }
  }

  openBatchModal(): void {
    if (!this.id || this.isDirty()) return;
    this.batchCount = 5;
    this.showBatchModal = true;
  }

  cancelBatch(): void {
    this.showBatchModal = false;
  }

  async confirmBatch(): Promise<void> {
    if (!this.id || this.batchCount < 1) return;

    this.showBatchModal = false;
    this.toastService.info(`Launching ${this.batchCount} experiments for "${this.plan.name}"...`);

    let firstExpId: string | null = null;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < this.batchCount; i++) {
      try {
        const response = await fetch('/api/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: this.id })
        });
        const exp = await response.json();

        if (i === 0) {
          firstExpId = exp._id;
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to launch experiment ${i + 1}:`, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      this.toastService.success(`Launched ${successCount} experiment${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      this.toastService.error(`Failed to launch ${failCount} experiment${failCount > 1 ? 's' : ''}`);
    }

    if (firstExpId) {
      this.router.navigate(['/experiments', firstExpId]);
    }
  }

  async deletePlan(): Promise<void> {
    if (!this.id) return;

    const shouldDelete = await this.confirmService.confirm({
      title: 'Delete Plan?',
      message: `Are you sure you want to delete "${this.plan.name}"?\n\nThis action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (shouldDelete) {
      this.planService.deletePlan(this.id).subscribe({
        next: () => {
          this.toastService.success(`Plan "${this.plan.name}" deleted`);
          this.bypassGuard = true;
          this.router.navigate(['/plans']);
        },
        error: (err) => {
          console.error('Failed to delete plan:', err);
          this.toastService.error('Failed to delete plan: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}

