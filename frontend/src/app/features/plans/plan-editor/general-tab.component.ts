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
          <label class="block text-sm font-medium text-gray-700 mb-3">Safety Limits</label>
          <div class="grid grid-cols-2 gap-6">
            <!-- Max Steps -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Max Steps</label>
              <div class="flex items-center">
                <input type="number" 
                       [ngModel]="maxSteps"
                       (ngModelChange)="onMaxStepsChange($event)"
                       min="1"
                       max="1000"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       [class.border-red-500]="maxStepsError"
                       [class.border-gray-300]="!maxStepsError">
              </div>
              <p class="mt-1 text-xs text-gray-400">Default: 20</p>
              <p *ngIf="maxStepsError" class="mt-1 text-xs text-red-600">{{ maxStepsError }}</p>
            </div>

            <!-- Max Retries -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Max Retries / Step</label>
              <div class="flex items-center">
                <input type="number" 
                       [ngModel]="maxStepRetries"
                       (ngModelChange)="onMaxStepRetriesChange($event)"
                       min="0"
                       max="10"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       [class.border-red-500]="maxStepRetriesError"
                       [class.border-gray-300]="!maxStepRetriesError">
              </div>
              <p class="mt-1 text-xs text-gray-400">Default: 3</p>
              <p *ngIf="maxStepRetriesError" class="mt-1 text-xs text-red-600">{{ maxStepRetriesError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GeneralTabComponent implements OnChanges {
  @Input() name = '';
  @Input() description = '';
  @Input() maxSteps = 20;
  @Input() maxStepRetries = 3;

  @Output() nameChange = new EventEmitter<string>();
  @Output() descriptionChange = new EventEmitter<string>();
  @Output() maxStepsChange = new EventEmitter<number>();
  @Output() maxStepRetriesChange = new EventEmitter<number>();
  @Output() isValidChange = new EventEmitter<boolean>();

  maxStepsError = '';
  maxStepRetriesError = '';

  ngOnChanges(): void {
    this.validate();
  }

  onMaxStepsChange(value: number): void {
    this.maxSteps = value;
    this.validate();
    this.maxStepsChange.emit(value);
  }

  onMaxStepRetriesChange(value: number): void {
    this.maxStepRetries = value;
    this.validate();
    this.maxStepRetriesChange.emit(value);
  }

  private validate(): void {
    this.maxStepsError = getPositiveIntegerError(this.maxSteps) || '';

    // Custom validation for retries (0 is allowed)
    if (this.maxStepRetries < 0 || !Number.isInteger(this.maxStepRetries)) {
      this.maxStepRetriesError = 'Must be 0 or greater';
    } else if (this.maxStepRetries > 10) {
      this.maxStepRetriesError = 'Max 10 retries';
    } else {
      this.maxStepRetriesError = '';
    }

    this.isValidChange.emit(!this.maxStepsError && !this.maxStepRetriesError);
  }
}
