import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanService, ExperimentPlan } from '../../core/services/plan.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
      
      <!-- Search Bar -->
      <div class="relative">
        <input type="text" 
               [(ngModel)]="searchQuery"
               placeholder="Search plans by name..."
               class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <button *ngIf="searchQuery" 
                (click)="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      
      <!-- Plan Cards -->
      <div class="space-y-4">
        <div *ngFor="let plan of filteredPlans" 
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
                <span>GOALS: {{ plan.goalCount }} Defined</span>
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
    
    <!-- Duplicate Name Input Modal -->
    <div *ngIf="showDuplicateModal" 
         class="fixed inset-0 z-[10000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelDuplicate()"></div>
      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Duplicate Plan</h3>
        </div>
        <div class="px-6 py-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Name for the duplicate:</label>
          <input type="text" 
                 [(ngModel)]="duplicateName"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 (keydown.enter)="confirmDuplicate()"
                 #duplicateInput>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button (click)="cancelDuplicate()"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium">
            Cancel
          </button>
          <button (click)="confirmDuplicate()"
                  [disabled]="!duplicateName.trim()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Duplicate
          </button>
        </div>
      </div>
    </div>
  `
})
export class PlanListComponent implements OnInit {
  plans: ExperimentPlan[] = [];
  searchQuery = '';

  // Duplicate modal state
  showDuplicateModal = false;
  duplicateName = '';
  planToDuplicate: ExperimentPlan | null = null;

  get filteredPlans(): ExperimentPlan[] {
    if (!this.searchQuery.trim()) {
      return this.plans;
    }
    const query = this.searchQuery.toLowerCase();
    return this.plans.filter(plan =>
      plan.name.toLowerCase().includes(query)
    );
  }

  constructor(
    private planService: PlanService,
    private confirmService: ConfirmService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.planService.getPlans().subscribe({
      next: (plans) => {
        // Sort alphabetically by name
        this.plans = plans.sort((a, b) => a.name.localeCompare(b.name));
      },
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
    this.planToDuplicate = plan;
    this.duplicateName = `${plan.name} (Copy)`;
    this.showDuplicateModal = true;

    // Focus the input after a tick
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  confirmDuplicate(): void {
    if (!this.planToDuplicate || !this.duplicateName.trim()) return;

    this.planService.duplicatePlan(this.planToDuplicate._id, this.duplicateName.trim()).subscribe({
      next: () => {
        this.toastService.success(`Plan duplicated as "${this.duplicateName.trim()}"`);
        this.loadPlans();
        this.cancelDuplicate();
      },
      error: (err) => {
        console.error('Failed to duplicate plan:', err);
        this.toastService.error('Failed to duplicate plan: ' + (err.error?.message || err.message));
      }
    });
  }

  cancelDuplicate(): void {
    this.showDuplicateModal = false;
    this.duplicateName = '';
    this.planToDuplicate = null;
  }

  async deletePlan(plan: ExperimentPlan): Promise<void> {
    const shouldDelete = await this.confirmService.confirm({
      title: 'Delete Plan?',
      message: `Are you sure you want to delete "${plan.name}"?\n\nThis action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (shouldDelete) {
      this.planService.deletePlan(plan._id).subscribe({
        next: () => {
          this.toastService.success(`Plan "${plan.name}" deleted`);
          this.loadPlans();
        },
        error: (err) => {
          console.error('Failed to delete plan:', err);
          this.toastService.error('Failed to delete plan: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
