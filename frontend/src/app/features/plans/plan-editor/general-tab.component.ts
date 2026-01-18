import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPositiveInteger, getPositiveIntegerError } from '../../../core/utils/validation.utils';

@Component({
  selector: 'app-general-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
      
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
          <input type="text" 
                 [ngModel]="name"
                 (ngModelChange)="nameChange.emit($event)"
                 placeholder="e.g., Market Analyzer V2"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea [ngModel]="description"
                    (ngModelChange)="descriptionChange.emit($event)"
                    rows="4"
                    placeholder="What does this experiment plan do?"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Safety Limits</label>
          <div class="flex items-center">
            <label class="text-sm text-gray-600 mr-3">Max Steps:</label>
            <input type="number" 
                   [ngModel]="maxSteps"
                   (ngModelChange)="onMaxStepsChange($event)"
                   min="1"
                   max="1000"
                   class="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   [class.border-red-500]="maxStepsError"
                   [class.border-gray-300]="!maxStepsError">
            <span class="ml-2 text-sm text-gray-500">(Default: 20)</span>
          </div>
          <p *ngIf="maxStepsError" class="mt-1 text-xs text-red-600">{{ maxStepsError }}</p>
        </div>
      </div>
    </div>
  `
})
export class GeneralTabComponent implements OnChanges {
  @Input() name = '';
  @Input() description = '';
  @Input() maxSteps = 20;

  @Output() nameChange = new EventEmitter<string>();
  @Output() descriptionChange = new EventEmitter<string>();
  @Output() maxStepsChange = new EventEmitter<number>();
  @Output() isValidChange = new EventEmitter<boolean>();

  maxStepsError = '';

  ngOnChanges(): void {
    this.validateMaxSteps();
  }

  onMaxStepsChange(value: number): void {
    this.maxSteps = value;
    this.validateMaxSteps();
    this.maxStepsChange.emit(value);
  }

  private validateMaxSteps(): void {
    this.maxStepsError = getPositiveIntegerError(this.maxSteps) || '';
    this.isValidChange.emit(!this.maxStepsError);
  }
}
