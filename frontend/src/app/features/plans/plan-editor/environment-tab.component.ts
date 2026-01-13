import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EnvVariable {
  key: string;
  type: string;
  value: string;
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
                     (ngModelChange)="onVariableChange()"
                     placeholder="variable_name"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
            </td>
            <td class="py-2 pr-4">
              <select [(ngModel)]="variable.type"
                      (ngModelChange)="onVariableChange()"
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
                     (ngModelChange)="onVariableChange()"
                     [placeholder]="getPlaceholder(variable.type)"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono">
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
                     (focus)="onNewRowFocus()"
                     (blur)="onNewRowBlur()"
                     placeholder="Add new variable..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
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
                     (focus)="onNewRowFocus()"
                     (blur)="onNewRowBlur()"
                     (keydown.tab)="onNewValueTab($any($event))"
                     [placeholder]="getPlaceholder(newVariable.type)"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-white">
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <p class="mt-2 text-xs text-gray-500">
        Type a variable name to add a new row. Press Tab to move between fields.
      </p>
    </div>
  `
})
export class EnvironmentTabComponent {
  @Input() set environment(value: { [key: string]: any }) {
    this.variables = Object.entries(value || {}).map(([key, val]) => ({
      key,
      type: this.detectType(val),
      value: typeof val === 'object' ? JSON.stringify(val) : String(val)
    }));
  }
  @Output() environmentChange = new EventEmitter<{ [key: string]: any }>();

  variables: EnvVariable[] = [];
  newVariable: EnvVariable = { key: '', type: 'string', value: '' };

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

  onVariableChange(): void {
    this.emitEnvironment();
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
    if (this.newVariable.key) {
      // Commit and reset, then let natural tab move to next element
      this.commitNewVariable();

      // Focus the new empty key input after a brief delay
      setTimeout(() => {
        const input = document.querySelector('[placeholder="Add new variable..."]') as HTMLInputElement;
        input?.focus();
      }, 0);
    }
  }

  // Commits the new variable to the list if it has a key
  private commitNewVariable(): void {
    if (this.newVariable.key.trim()) {
      this.variables.push({ ...this.newVariable });
      this.newVariable = { key: '', type: 'string', value: '' };
      this.emitEnvironment();
    }
  }

  removeVariable(index: number): void {
    this.variables.splice(index, 1);
    this.emitEnvironment();
  }

  private emitEnvironment(): void {
    const env: { [key: string]: any } = {};
    for (const variable of this.variables) {
      if (variable.key) {
        env[variable.key] = this.parseValue(variable);
      }
    }
    this.environmentChange.emit(env);
  }
}
