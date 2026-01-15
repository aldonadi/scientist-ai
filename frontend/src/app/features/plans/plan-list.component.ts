import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanService, ExperimentPlan } from '../../core/services/plan.service';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Experiment Plans</h1>
        <a routerLink="/plans/new" 
           class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Create New Plan
        </a>
      </div>
      
      <!-- Plan Cards -->
      <div class="space-y-4">
        <div *ngFor="let plan of plans" 
             class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center">
                <h2 class="text-xl font-semibold text-gray-900">{{ plan.name }}</h2>
              </div>
              <p class="text-gray-600 mt-1">{{ plan.description }}</p>
              
              <!-- Role Chips -->
              <div class="flex items-center flex-wrap gap-2 mt-4">
                <span class="text-sm text-gray-500">ROLES:</span>
                <span *ngFor="let role of plan.roles || []" 
                      class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {{ role.name }}
                </span>
                <span *ngIf="(plan.roles || []).length === 0" class="text-sm text-gray-400 italic">
                  No roles defined
                </span>
              </div>
              
              <!-- Stats -->
              <div class="flex items-center gap-6 mt-4 text-sm text-gray-500">
                <span>LIMIT: {{ plan.maxSteps }} Steps</span>
                <span>GOALS: {{ (plan.goals || []).length }} Defined</span>
              </div>
              
              <!-- Last Run (placeholder) -->
              <div class="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                Last Run: {{ getLastRun(plan) }}
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex flex-col space-y-2 ml-6">
              <button (click)="runPlan(plan)" 
                      class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                Run
              </button>
              <a [routerLink]="['/plans', plan._id]" 
                 class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center">
                Edit
              </a>
              <button (click)="duplicatePlan(plan)" 
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Duplicate
              </button>
              <button (click)="deletePlan(plan)" 
                      class="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <div *ngIf="plans.length === 0" 
             class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p class="text-gray-500">No experiment plans found. Create your first plan!</p>
        </div>
      </div>
    </div>
  `
})
export class PlanListComponent implements OnInit {
  plans: ExperimentPlan[] = [];

  constructor(private planService: PlanService) { }

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.planService.getPlans().subscribe({
      next: (plans) => this.plans = plans,
      error: (err) => console.error('Failed to load plans:', err)
    });
  }

  getLastRun(plan: ExperimentPlan): string {
    // This would come from experiment data in a real app
    return 'Never';
  }

  runPlan(plan: ExperimentPlan): void {
    // Launch experiment from plan
    fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan._id })
    })
      .then(res => res.json())
      .then(exp => {
        window.location.href = `/experiments/${exp._id}`;
      })
      .catch(err => console.error('Failed to launch experiment:', err));
  }

  duplicatePlan(plan: ExperimentPlan): void {
    const newName = prompt('Name for duplicated plan:', `${plan.name} (Copy)`);
    if (newName) {
      this.planService.duplicatePlan(plan._id, newName).subscribe({
        next: () => this.loadPlans(),
        error: (err) => console.error('Failed to duplicate plan:', err)
      });
    }
  }

  deletePlan(plan: ExperimentPlan): void {
    if (confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      this.planService.deletePlan(plan._id).subscribe({
        next: () => this.loadPlans(),
        error: (err) => console.error('Failed to delete plan:', err)
      });
    }
  }
}
