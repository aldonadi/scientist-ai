import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal } from '../../../core/services/plan.service';

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
        <div *ngFor="let goal of goals; let i = index" 
             class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start justify-between mb-2">
            <span class="text-sm text-gray-500">Goal {{ i + 1 }}</span>
            <button (click)="removeGoal(i)" class="text-red-600 hover:text-red-800 text-sm">Del</button>
          </div>
          <input type="text" 
                 [(ngModel)]="goal.conditionScript"
                 (ngModelChange)="emitGoals()"
                 placeholder="Env.money > 10000 (Python Expression)"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <input type="text" 
                 [(ngModel)]="goal.description"
                 (ngModelChange)="emitGoals()"
                 placeholder="Description (e.g., Profit Target Reached)"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        
        <div *ngIf="goals.length === 0" class="text-center text-gray-500 py-8">
          No goals defined. Add termination conditions.
        </div>
      </div>
    </div>
  `
})
export class GoalsTabComponent {
    @Input() goals: Goal[] = [];
    @Output() goalsChange = new EventEmitter<Goal[]>();

    addGoal(): void {
        this.goals.push({ description: '', conditionScript: '' });
        this.emitGoals();
    }

    removeGoal(index: number): void {
        this.goals.splice(index, 1);
        this.emitGoals();
    }

    emitGoals(): void {
        this.goalsChange.emit([...this.goals]);
    }
}
