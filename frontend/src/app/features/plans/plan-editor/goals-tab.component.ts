import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal } from '../../../core/services/plan.service';
import { checkPythonSyntax } from '../../../core/utils/validation.utils';

interface GoalWithError extends Goal {
  error?: string;
}

@Component({
  selector: 'app-goals-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Goals (Termination Conditions)</h2>
          <p class="text-sm text-gray-500">Define conditions for when the plan should end</p>
        </div>
        <button (click)="addGoal()" 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
          (+) Add Goal
        </button>
      </div>
      
      <div class="space-y-4">
        <div *ngFor="let goal of goalsWithErrors; let i = index; trackBy: trackByIndex" 
             class="border rounded-lg p-4"
             [class.border-red-300]="goal.error"
             [class.border-gray-200]="!goal.error">
          <div class="flex items-start justify-between mb-2">
            <span class="text-sm text-gray-500">Goal {{ i + 1 }}</span>
            <button (click)="removeGoal(i)" class="text-red-600 hover:text-red-800 text-sm">Del</button>
          </div>
          <input type="text" 
                 [(ngModel)]="goal.conditionScript"
                 (ngModelChange)="validateGoal(i)"
                 placeholder="env.money > 10000 (Python Expression)"
                 class="w-full px-3 py-2 border rounded-lg font-mono text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 [class.border-red-500]="goal.error"
                 [class.border-gray-300]="!goal.error">
          <p *ngIf="goal.error" class="text-xs text-red-600 mb-2">{{ goal.error }}</p>
          <input type="text" 
                 [(ngModel)]="goal.description"
                 (ngModelChange)="emitGoals()"
                 placeholder="Description (e.g., Profit Target Reached)"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        
        <div *ngIf="goalsWithErrors.length === 0" class="text-center text-gray-500 py-8">
          No goals defined. Add termination conditions.
        </div>
      </div>
      
      <p class="mt-4 text-xs text-gray-500">
        Condition scripts must be valid Python expressions that evaluate to True/False.
      </p>
    </div>
  `
})
export class GoalsTabComponent {
  @Input() set goals(value: Goal[]) {
    this.goalsWithErrors = (value || []).map(g => ({
      ...g,
      error: ''
    }));
    this.validateAllGoals();
  }
  @Output() goalsChange = new EventEmitter<Goal[]>();
  @Output() isValidChange = new EventEmitter<boolean>();

  goalsWithErrors: GoalWithError[] = [];

  addGoal(): void {
    this.goalsWithErrors.push({ description: '', conditionScript: '', error: '' });
    this.emitGoals();
  }

  removeGoal(index: number): void {
    this.goalsWithErrors.splice(index, 1);
    this.emitGoals();
  }

  validateGoal(index: number): void {
    const goal = this.goalsWithErrors[index];
    if (!goal.conditionScript || !goal.conditionScript.trim()) {
      goal.error = 'Condition is required';
    } else {
      const result = checkPythonSyntax(goal.conditionScript);
      goal.error = result.valid ? '' : (result.error || 'Invalid Python syntax');
    }
    this.emitGoals();
  }

  validateAllGoals(): void {
    for (let i = 0; i < this.goalsWithErrors.length; i++) {
      const goal = this.goalsWithErrors[i];
      if (goal.conditionScript && goal.conditionScript.trim()) {
        const result = checkPythonSyntax(goal.conditionScript);
        goal.error = result.valid ? '' : (result.error || 'Invalid Python syntax');
      } else {
        goal.error = 'Condition is required';
      }
    }
    this.emitValidity();
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  emitGoals(): void {
    const goals: Goal[] = this.goalsWithErrors.map(({ error, ...goal }) => goal);
    this.goalsChange.emit(goals);
    this.emitValidity();
  }

  private emitValidity(): void {
    const hasErrors = this.goalsWithErrors.some(g => g.error);
    this.isValidChange.emit(!hasErrors);
  }
}
