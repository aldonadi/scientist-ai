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
          <tr *ngFor="let variable of variables; let i = index" class="border-b border-gray-100">
            <td class="py-2 pr-4">
              <input type="text" 
                     [(ngModel)]="variable.key"
                     (ngModelChange)="onVariableChange()"
                     (keydown.tab)="handleTab($any($event), i, 'key')"
                     placeholder="variable_name"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
            </td>
            <td class="py-2 pr-4">
              <select [(ngModel)]="variable.type"
                      (ngModelChange)="onVariableChange()"
                      (keydown.tab)="handleTab($any($event), i, 'type')"
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
                     (keydown.tab)="handleTab($any($event), i, 'value')"
                     [placeholder]="getPlaceholder(variable.type)"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono">
            </td>
            <td class="py-2">
              <button *ngIf="variable.key" 
                      (click)="removeVariable(i)"
                      class="text-red-600 hover:text-red-800 text-sm"
                      tabindex="-1">
                Del
              </button>
            </td>
          </tr>
          
          <!-- Empty Row for Quick Entry -->
          <tr class="border-b border-gray-100 bg-gray-50">
            <td class="py-2 pr-4">
              <input type="text" 
                     #newKeyInput
                     [(ngModel)]="newVariable.key"
                     (input)="onNewKeyInput()"
                     (keydown.tab)="handleNewTab($any($event), 'key')"
                     placeholder="Add new variable..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
            </td>
            <td class="py-2 pr-4">
              <select [(ngModel)]="newVariable.type"
                      (keydown.tab)="handleNewTab($any($event), 'type')"
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
                     (keydown.tab)="handleNewTab($any($event), 'value')"
                     [placeholder]="getPlaceholder(newVariable.type)"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-white">
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <p class="mt-2 text-xs text-gray-500">
        (Press Tab to move between fields. New rows are added automatically.)
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

  onNewKeyInput(): void {
    if (this.newVariable.key) {
      // Move new variable to the list and reset
      this.variables.push({ ...this.newVariable });
      this.newVariable = { key: '', type: 'string', value: '' };
      this.emitEnvironment();
    }
  }

  handleTab(event: KeyboardEvent, index: number, field: string): void {
    if (field === 'value') {
      // Tab from value field should go to next row's key field
      event.preventDefault();
      const nextRow = index + 1;
      if (nextRow >= this.variables.length) {
        // Focus the new variable input
        setTimeout(() => {
          const input = document.querySelector('[placeholder="Add new variable..."]') as HTMLInputElement;
          input?.focus();
        }, 0);
      }
    }
  }

  handleNewTab(event: KeyboardEvent, field: string): void {
    if (field === 'value' && this.newVariable.key) {
      // Commit the new row and focus the new empty row
      event.preventDefault();
      this.onNewKeyInput();
      setTimeout(() => {
        const input = document.querySelector('[placeholder="Add new variable..."]') as HTMLInputElement;
        input?.focus();
      }, 0);
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
