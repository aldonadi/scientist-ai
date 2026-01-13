import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlanService, ExperimentPlan, CreatePlanDto, Role, Goal, Script } from '../../../core/services/plan.service';
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
        </div>
        <div class="flex items-center space-x-3">
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
        <app-general-tab 
          *ngIf="activeTab === 'general'"
          [(name)]="plan.name"
          [(description)]="plan.description"
          [(maxSteps)]="plan.maxSteps">
        </app-general-tab>
        
        <app-environment-tab 
          *ngIf="activeTab === 'environment'"
          [(environment)]="plan.initialEnvironment">
        </app-environment-tab>
        
        <app-roles-tab 
          *ngIf="activeTab === 'roles'"
          [(roles)]="plan.roles">
        </app-roles-tab>
        
        <app-goals-tab 
          *ngIf="activeTab === 'goals'"
          [(goals)]="plan.goals">
        </app-goals-tab>
        
        <app-scripts-tab 
          *ngIf="activeTab === 'scripts'"
          [(scripts)]="plan.scripts">
        </app-scripts-tab>
      </div>
    </div>
  `
})
export class PlanEditorComponent implements OnInit {
  @Input() id?: string;

  isNew = true;
  activeTab = 'general';

  tabs = [
    { id: 'general', label: 'General' },
    { id: 'environment', label: 'Environment' },
    { id: 'roles', label: 'Roles' },
    { id: 'goals', label: 'Goals' },
    { id: 'scripts', label: 'Scripts' }
  ];

  plan: {
    name: string;
    description: string;
    initialEnvironment: { [key: string]: any };
    roles: Role[];
    goals: Goal[];
    scripts: Script[];
    maxSteps: number;
  } = {
      name: '',
      description: '',
      initialEnvironment: {},
      roles: [],
      goals: [],
      scripts: [],
      maxSteps: 20
    };

  constructor(
    private planService: PlanService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId && routeId !== 'new') {
      this.id = routeId;
      this.isNew = false;
      this.loadPlan();
    }
  }

  loadPlan(): void {
    if (!this.id) return;

    this.planService.getPlan(this.id).subscribe({
      next: (plan) => {
        this.plan = {
          name: plan.name,
          description: plan.description,
          initialEnvironment: plan.initialEnvironment || {},
          roles: plan.roles || [],
          goals: plan.goals || [],
          scripts: plan.scripts || [],
          maxSteps: plan.maxSteps || 20
        };
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
    const action = this.isNew
      ? this.planService.createPlan(this.plan)
      : this.planService.updatePlan(this.id!, this.plan);

    action.subscribe({
      next: () => this.router.navigate(['/plans']),
      error: (err) => console.error('Failed to save plan:', err)
    });
  }

  goBack(): void {
    this.router.navigate(['/plans']);
  }
}
