import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isValidPythonIdentifier, getPythonIdentifierError, validateEnvValue } from '../../../core/utils/validation.utils';

interface EnvVariable {
  key: string;
  type: string;
  value: string;
  keyError?: string;
  valueError?: string;
}

@Component({
  selector: 'app-environment-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Initial Variables</h2>
      
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-1/4">Key</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-1/6">Type</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Initial Value</th>
            <th class="w-16"></th>
          </tr>
        </thead>
        <tbody>
          <!-- Existing Variables -->
          <tr *ngFor="let variable of variables; let i = index" class="border-b border-gray-100">
            <td class="py-2 pr-4">
              <input type="text" 
                     [(ngModel)]="variable.key"
                     (ngModelChange)="onVariableKeyChange(i)"
                     placeholder="variable_name"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                     [class.border-red-500]="variable.keyError"
                     [class.border-gray-300]="!variable.keyError">
              <p *ngIf="variable.keyError" class="mt-1 text-xs text-red-600">{{ variable.keyError }}</p>
            </td>
            <td class="py-2 pr-4">
              <select [(ngModel)]="variable.type"
                      (ngModelChange)="onVariableTypeChange(i)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <input type="text" 
                     [(ngModel)]="variable.value"
                     (ngModelChange)="onVariableValueChange(i)"
                     [placeholder]="getPlaceholder(variable.type)"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                     [class.border-red-500]="variable.valueError"
                     [class.border-gray-300]="!variable.valueError">
              <p *ngIf="variable.valueError" class="mt-1 text-xs text-red-600">{{ variable.valueError }}</p>
            </td>
            <td class="py-2">
              <button (click)="removeVariable(i)"
                      class="text-red-600 hover:text-red-800 text-sm"
                      tabindex="-1">
                Del
              </button>
            </td>
          </tr>
          
          <!-- New Variable Entry Row (always at bottom) -->
          <tr class="border-b border-gray-100 bg-gray-50">
            <td class="py-2 pr-4">
              <input type="text" 
                     #newKeyInput
                     [(ngModel)]="newVariable.key"
                     (ngModelChange)="validateNewKey()"
                     (focus)="onNewRowFocus()"
                     (blur)="onNewRowBlur()"
                     placeholder="Add new variable..."
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                     [class.border-red-500]="newVariable.keyError"
                     [class.border-gray-300]="!newVariable.keyError">
              <p *ngIf="newVariable.keyError" class="mt-1 text-xs text-red-600">{{ newVariable.keyError }}</p>
            </td>
            <td class="py-2 pr-4">
              <select [(ngModel)]="newVariable.type"
                      (focus)="onNewRowFocus()"
                      (blur)="onNewRowBlur()"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <input type="text" 
                     [(ngModel)]="newVariable.value"
                     (ngModelChange)="validateNewValue()"
                     (focus)="onNewRowFocus()"
                     (blur)="onNewRowBlur()"
                     (keydown.tab)="onNewValueTab($any($event))"
                     [placeholder]="getPlaceholder(newVariable.type)"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-white"
                     [class.border-red-500]="newVariable.valueError"
                     [class.border-gray-300]="!newVariable.valueError">
              <p *ngIf="newVariable.valueError" class="mt-1 text-xs text-red-600">{{ newVariable.valueError }}</p>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <p class="mt-2 text-xs text-gray-500">
        Variable names must be valid Python identifiers (start with letter/underscore, only letters/numbers/underscores).
      </p>
    </div>
  `
})
export class EnvironmentTabComponent {
  @Input() set environment(value: { [key: string]: any }) {
    this.variables = Object.entries(value || {}).map(([key, val]) => ({
      key,
      type: this.detectType(val),
      value: typeof val === 'object' ? JSON.stringify(val) : String(val),
      keyError: '',
      valueError: ''
    }));
    this.validateAllVariables();
  }
  @Output() environmentChange = new EventEmitter<{ [key: string]: any }>();
  @Output() isValidChange = new EventEmitter<boolean>();

  variables: EnvVariable[] = [];
  newVariable: EnvVariable = { key: '', type: 'string', value: '', keyError: '', valueError: '' };

  private isInNewRow = false;
  private blurTimeout: any = null;

  detectType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }

  getPlaceholder(type: string): string {
    switch (type) {
      case 'number': return '0';
      case 'boolean': return 'true/false';
      case 'array': return '["item1", "item2"]';
      case 'object': return '{"key": "value"}';
      default: return '"text"';
    }
  }

  parseValue(variable: EnvVariable): any {
    try {
      switch (variable.type) {
        case 'number': return parseFloat(variable.value) || 0;
        case 'boolean': return variable.value.toLowerCase() === 'true';
        case 'array':
        case 'object': return JSON.parse(variable.value);
        default: return variable.value;
      }
    } catch {
      return variable.value;
    }
  }

  onVariableKeyChange(index: number): void {
    const variable = this.variables[index];
    variable.keyError = variable.key ? (getPythonIdentifierError(variable.key) || '') : '';
    this.emitEnvironment();
  }

  onVariableTypeChange(index: number): void {
    this.onVariableValueChange(index); // Re-validate value for new type
  }

  onVariableValueChange(index: number): void {
    const variable = this.variables[index];
    const result = validateEnvValue(variable.value, variable.type);
    variable.valueError = result.valid ? '' : (result.error || '');
    this.emitEnvironment();
  }

  validateNewKey(): void {
    if (this.newVariable.key) {
      this.newVariable.keyError = getPythonIdentifierError(this.newVariable.key) || '';
    } else {
      this.newVariable.keyError = '';
    }
  }

  validateNewValue(): void {
    if (this.newVariable.value) {
      const result = validateEnvValue(this.newVariable.value, this.newVariable.type);
      this.newVariable.valueError = result.valid ? '' : (result.error || '');
    } else {
      this.newVariable.valueError = '';
    }
  }

  // Called when any field in the new row gains focus
  onNewRowFocus(): void {
    // Cancel any pending blur commit
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }
    this.isInNewRow = true;
  }

  // Called when any field in the new row loses focus
  onNewRowBlur(): void {
    // Use a short timeout to check if focus moved to another field in the same row
    // If focus moves within the new row, onNewRowFocus will cancel this
    this.blurTimeout = setTimeout(() => {
      this.isInNewRow = false;
      this.commitNewVariable();
    }, 100);
  }

  // Called when Tab is pressed on the value field of the new row
  onNewValueTab(event: KeyboardEvent): void {
    if (this.newVariable.key && !this.newVariable.keyError && !this.newVariable.valueError) {
      // Commit and reset, then let natural tab move to next element
      this.commitNewVariable();

      // Focus the new empty key input after a brief delay
      setTimeout(() => {
        const input = document.querySelector('[placeholder="Add new variable..."]') as HTMLInputElement;
        input?.focus();
      }, 0);
    }
  }

  // Commits the new variable to the list if it has a valid key
  private commitNewVariable(): void {
    if (this.newVariable.key.trim() && !this.newVariable.keyError && !this.newVariable.valueError) {
      this.variables.push({ ...this.newVariable });
      this.newVariable = { key: '', type: 'string', value: '', keyError: '', valueError: '' };
      this.emitEnvironment();
    }
  }

  removeVariable(index: number): void {
    this.variables.splice(index, 1);
    this.emitEnvironment();
  }

  private validateAllVariables(): void {
    for (let i = 0; i < this.variables.length; i++) {
      const variable = this.variables[i];
      if (variable.key) {
        variable.keyError = getPythonIdentifierError(variable.key) || '';
      }
      const result = validateEnvValue(variable.value, variable.type);
      variable.valueError = result.valid ? '' : (result.error || '');
    }
    this.emitValidity();
  }

  private emitEnvironment(): void {
    const env: { [key: string]: any } = {};
    for (const variable of this.variables) {
      if (variable.key && !variable.keyError && !variable.valueError) {
        env[variable.key] = this.parseValue(variable);
      }
    }
    this.environmentChange.emit(env);
    this.emitValidity();
  }

  private emitValidity(): void {
    const hasErrors = this.variables.some(v => v.keyError || v.valueError);
    this.isValidChange.emit(!hasErrors);
  }
}
