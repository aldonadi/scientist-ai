import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanService, ExperimentPlan } from '../../core/services/plan.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Sticky Header -->
      <div class="flex-shrink-0 space-y-4 pb-4 border-b border-gray-200 bg-gray-50 -mx-8 px-8 -mt-6 pt-6">
        <!-- Title Row -->
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
                 class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <button *ngIf="searchQuery" 
                  (click)="searchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <!-- Auto-open checkbox -->
        <label class="flex items-center text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" 
                 [(ngModel)]="autoOpenOnRun"
                 class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2">
          Auto-open the experiment page on Run
        </label>
      </div>
      
      <!-- Scrollable Plan Cards -->
      <div class="flex-1 overflow-auto pt-4 -mx-8 px-8 space-y-4">
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
            <div class="flex flex-col space-y-2 ml-6 w-32">
              <!-- Run / Batch button group -->
              <div class="flex">
                <button (click)="runPlan(plan)" 
                        class="flex-1 px-3 py-2 bg-green-600 text-white rounded-l-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Run
                </button>
                <button (click)="openBatchModal(plan)" 
                        class="px-3 py-2 bg-green-700 text-white rounded-r-lg text-sm font-medium hover:bg-green-800 transition-colors border-l border-green-500">
                  Batch
                </button>
              </div>
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
        
        <div *ngIf="filteredPlans.length === 0 && plans.length > 0" 
             class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p class="text-gray-500">No plans match your search.</p>
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
    
    <!-- Batch Run Modal -->
    <div *ngIf="showBatchModal" 
         class="fixed inset-0 z-[10000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="cancelBatch()"></div>
      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Launch Batch Experiments</h3>
          <p class="text-sm text-gray-500 mt-1">Plan: {{ planToBatch?.name }}</p>
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
          
          <label class="flex items-center text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" 
                   [(ngModel)]="batchAutoOpen"
                   class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2">
            Open the first experiment after launching
          </label>
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
export class PlanListComponent implements OnInit {
  plans: ExperimentPlan[] = [];
  searchQuery = '';
  autoOpenOnRun = true;

  // Duplicate modal state
  showDuplicateModal = false;
  duplicateName = '';
  planToDuplicate: ExperimentPlan | null = null;

  // Batch modal state
  showBatchModal = false;
  planToBatch: ExperimentPlan | null = null;
  batchCount = 5;
  batchAutoOpen = false;

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
    private toastService: ToastService,
    private router: Router
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

  async runPlan(plan: ExperimentPlan): Promise<void> {
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan._id })
      });
      const exp = await response.json();

      this.toastService.success(`Experiment launched for "${plan.name}"`);

      if (this.autoOpenOnRun) {
        this.router.navigate(['/experiments', exp._id]);
      }
    } catch (err) {
      console.error('Failed to launch experiment:', err);
      this.toastService.error('Failed to launch experiment');
    }
  }

  // Batch modal methods
  openBatchModal(plan: ExperimentPlan): void {
    this.planToBatch = plan;
    this.batchCount = 5;
    this.batchAutoOpen = false;
    this.showBatchModal = true;
  }

  cancelBatch(): void {
    this.showBatchModal = false;
    this.planToBatch = null;
  }

  async confirmBatch(): Promise<void> {
    if (!this.planToBatch || this.batchCount < 1) return;

    const plan = this.planToBatch;
    const count = this.batchCount;
    const openFirst = this.batchAutoOpen;

    this.showBatchModal = false;
    this.toastService.info(`Launching ${count} experiments for "${plan.name}"...`);

    let firstExpId: string | null = null;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < count; i++) {
      try {
        const response = await fetch('/api/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan._id })
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

    if (openFirst && firstExpId) {
      this.router.navigate(['/experiments', firstExpId]);
    }

    this.planToBatch = null;
  }

  // Duplicate methods
  duplicatePlan(plan: ExperimentPlan): void {
    this.planToDuplicate = plan;
    this.duplicateName = `${plan.name} (Copy)`;
    this.showDuplicateModal = true;

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
