import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isValidPythonIdentifier, getPythonIdentifierError, validateEnvValue } from '../../../core/utils/validation.utils';
import { Role } from '../../../core/services/plan.service';
import { VisibilityMatrixModalComponent } from './visibility-matrix-modal.component';

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
  imports: [CommonModule, FormsModule, VisibilityMatrixModalComponent],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Initial Variables</h2>
        <button (click)="openMatrix()" 
                class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors flex items-center gap-1">
          <span>🔧</span> Visibility Matrix
        </button>
      </div>
      
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="w-8"></th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-1/4">Key</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-1/6">Type</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Initial Value</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-24">Visible</th>
            <th class="w-16"></th>
          </tr>
        </thead>
        <tbody>
          <!-- Existing Variables -->
          <ng-container *ngFor="let variable of variables; let i = index">
            <tr class="border-b border-gray-100">
              <td class="py-2">
                <button (click)="toggleExpand(i)" 
                        class="text-gray-400 hover:text-gray-600 text-sm"
                        [class.text-gray-600]="expandedRows.has(i)">
                  {{ expandedRows.has(i) ? '▼' : '▶' }}
                </button>
              </td>
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
                  <option value="array">List (Array)</option>
                  <option value="object">Dictionary (Object)</option>
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
              <td class="py-2 pr-4">
                <span class="text-sm text-gray-600">{{ getVisibilitySummary(variable.key) }}</span>
              </td>
              <td class="py-2">
                <button (click)="removeVariable(i)"
                        class="text-red-600 hover:text-red-800 text-sm"
                        tabindex="-1">
                  Del
                </button>
              </td>
            </tr>
            
            <!-- Expanded Row: Role Visibility -->
            <tr *ngIf="expandedRows.has(i)" class="bg-gray-50">
              <td></td>
              <td colspan="5" class="py-3 px-4">
                <div class="flex items-center gap-4 flex-wrap">
                  <span class="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <span>👁️</span> Role Visibility:
                  </span>
                  <label *ngFor="let role of roles; let ri = index" 
                         class="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" 
                           [checked]="isVisibleToRole(variable.key, ri)"
                           (change)="toggleVisibilityForRole(variable.key, ri)"
                           class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                    {{ role.name || 'Role ' + (ri + 1) }}
                  </label>
                  <span *ngIf="roles.length === 0" class="text-sm text-gray-400 italic">
                    No roles defined
                  </span>
                </div>
              </td>
            </tr>
          </ng-container>
          
          <!-- New Variable Entry Row (always at bottom) -->
          <tr class="border-b border-gray-100 bg-gray-50">
            <td></td>
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
                <option value="array">List (Array)</option>
                <option value="object">Dictionary (Object)</option>
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
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <p class="mt-2 text-xs text-gray-500">
        Variable names must be valid Python identifiers (start with letter/underscore, only letters/numbers/underscores).
      </p>
    </div>
    
    <!-- Visibility Matrix Modal -->
    <app-visibility-matrix-modal
      [isOpen]="showMatrix"
      [roles]="roles"
      [variableKeys]="getVariableKeys()"
      (rolesChange)="onMatrixRolesChange($event)"
      (closeModal)="closeMatrix()">
    </app-visibility-matrix-modal>
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
  @Input() roles: Role[] = [];

  @Output() environmentChange = new EventEmitter<{ [key: string]: any }>();
  @Output() rolesChange = new EventEmitter<Role[]>();
  @Output() isValidChange = new EventEmitter<boolean>();

  variables: EnvVariable[] = [];
  newVariable: EnvVariable = { key: '', type: 'string', value: '', keyError: '', valueError: '' };
  expandedRows = new Set<number>();
  showMatrix = false;

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

  // --- Variable key/value/type changes ---

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

  // --- Expand/Collapse ---

  toggleExpand(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  // --- Visibility per Role ---

  getVisibilitySummary(varKey: string): string {
    if (this.roles.length === 0) return '—';

    let visibleCount = 0;
    for (const role of this.roles) {
      if (!role.variableWhitelist || role.variableWhitelist.length === 0) {
        visibleCount++; // Empty = all visible
      } else if (role.variableWhitelist.includes(varKey)) {
        visibleCount++;
      }
    }

    if (visibleCount === this.roles.length) return 'All';
    if (visibleCount === 0) return 'None';
    return `${visibleCount} Roles`;
  }

  isVisibleToRole(varKey: string, roleIndex: number): boolean {
    const role = this.roles[roleIndex];
    if (!role) return false;

    // Empty whitelist = all visible
    if (!role.variableWhitelist || role.variableWhitelist.length === 0) {
      return true;
    }
    return role.variableWhitelist.includes(varKey);
  }

  toggleVisibilityForRole(varKey: string, roleIndex: number): void {
    const role = this.roles[roleIndex];
    if (!role) return;

    const allKeys = this.getVariableKeys();

    // Initialize whitelist if empty (meaning "all") - we need to expand it
    if (!role.variableWhitelist || role.variableWhitelist.length === 0) {
      // When toggling from "all visible", we expand to explicit list minus the toggled one
      role.variableWhitelist = allKeys.filter(k => k !== varKey);
    } else {
      const idx = role.variableWhitelist.indexOf(varKey);
      if (idx >= 0) {
        // Remove from whitelist
        role.variableWhitelist.splice(idx, 1);
      } else {
        // Add to whitelist
        role.variableWhitelist.push(varKey);
      }
    }

    this.rolesChange.emit([...this.roles]);
  }

  getVariableKeys(): string[] {
    return this.variables.filter(v => v.key && !v.keyError).map(v => v.key);
  }

  // --- Matrix Modal ---

  openMatrix(): void {
    this.showMatrix = true;
  }

  closeMatrix(): void {
    this.showMatrix = false;
  }

  onMatrixRolesChange(roles: Role[]): void {
    this.roles = roles;
    this.rolesChange.emit([...roles]);
  }

  // --- New Row Focus/Blur ---

  onNewRowFocus(): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }
    this.isInNewRow = true;
  }

  onNewRowBlur(): void {
    this.blurTimeout = setTimeout(() => {
      this.isInNewRow = false;
      this.commitNewVariable();
    }, 100);
  }

  onNewValueTab(event: KeyboardEvent): void {
    if (this.newVariable.key && !this.newVariable.keyError && !this.newVariable.valueError) {
      this.commitNewVariable();
      setTimeout(() => {
        const input = document.querySelector('[placeholder="Add new variable..."]') as HTMLInputElement;
        input?.focus();
      }, 0);
    }
  }

  private commitNewVariable(): void {
    if (this.newVariable.key.trim() && !this.newVariable.keyError && !this.newVariable.valueError) {
      this.variables.push({ ...this.newVariable });
      this.newVariable = { key: '', type: 'string', value: '', keyError: '', valueError: '' };
      this.emitEnvironment();
    }
  }

  removeVariable(index: number): void {
    this.variables.splice(index, 1);
    this.expandedRows.delete(index);
    // Reindex expanded rows
    const newExpanded = new Set<number>();
    this.expandedRows.forEach(i => {
      if (i > index) {
        newExpanded.add(i - 1);
      } else if (i < index) {
        newExpanded.add(i);
      }
    });
    this.expandedRows = newExpanded;
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
