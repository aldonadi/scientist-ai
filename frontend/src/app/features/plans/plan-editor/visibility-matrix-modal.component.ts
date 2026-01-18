import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../core/services/plan.service';

@Component({
    selector: 'app-visibility-matrix-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" (click)="onBackdropClick($event)">
      <div class="flex items-center justify-center min-h-screen px-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity"></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col" 
             (click)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🔧</span> Variable Visibility Matrix
            </h2>
            <button (click)="close()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-auto p-6">
            <div *ngIf="roles.length === 0 || variableKeys.length === 0" 
                 class="text-center text-gray-500 py-8">
              <p *ngIf="roles.length === 0">No roles defined. Add roles first.</p>
              <p *ngIf="variableKeys.length === 0">No environment variables defined.</p>
            </div>
            
            <table *ngIf="roles.length > 0 && variableKeys.length > 0" class="w-full border-collapse">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 sticky left-0 bg-white">
                    Variable
                  </th>
                  <th *ngFor="let role of roles; let ri = index" 
                      class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-2 min-w-[80px]">
                    <div class="truncate max-w-[100px]" [title]="role.name">{{ role.name || 'Role ' + (ri + 1) }}</div>
                  </th>
                  <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pl-4">
                    Row Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let varKey of variableKeys; let vi = index" 
                    class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 pr-4 sticky left-0 bg-white">
                    <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ varKey }}</code>
                  </td>
                  <td *ngFor="let role of roles; let ri = index" class="py-3 px-2 text-center">
                    <input type="checkbox" 
                           [checked]="isVisible(ri, varKey)"
                           (change)="toggleVisibility(ri, varKey)"
                           class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer">
                  </td>
                  <td class="py-3 pl-4 text-center">
                    <button (click)="setRowAll(varKey, true)" 
                            class="text-xs text-blue-600 hover:text-blue-800 mr-2">All</button>
                    <button (click)="setRowAll(varKey, false)" 
                            class="text-xs text-red-600 hover:text-red-800">None</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-gray-200">
                  <td class="py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Column Actions</td>
                  <td *ngFor="let role of roles; let ri = index" class="py-3 px-2 text-center">
                    <button (click)="setColumnAll(ri, true)" 
                            class="text-xs text-blue-600 hover:text-blue-800 block mx-auto">All</button>
                    <button (click)="setColumnAll(ri, false)" 
                            class="text-xs text-red-600 hover:text-red-800 block mx-auto mt-1">None</button>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button (click)="close()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VisibilityMatrixModalComponent {
    @Input() isOpen = false;
    @Input() roles: Role[] = [];
    @Input() variableKeys: string[] = [];

    @Output() rolesChange = new EventEmitter<Role[]>();
    @Output() closeModal = new EventEmitter<void>();

    /**
     * Check if a variable is visible to a role.
     * Empty whitelist means "all visible".
     */
    isVisible(roleIndex: number, varKey: string): boolean {
        const role = this.roles[roleIndex];
        if (!role) return false;

        // Empty whitelist = all visible
        if (!role.variableWhitelist || role.variableWhitelist.length === 0) {
            return true;
        }
        return role.variableWhitelist.includes(varKey);
    }

    /**
     * Toggle visibility of a variable for a role.
     */
    toggleVisibility(roleIndex: number, varKey: string): void {
        const role = this.roles[roleIndex];
        if (!role) return;

        // Initialize whitelist if empty (meaning "all") - we need to expand it
        if (!role.variableWhitelist || role.variableWhitelist.length === 0) {
            // When toggling from "all visible", we expand to explicit list minus the toggled one
            role.variableWhitelist = this.variableKeys.filter(k => k !== varKey);
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

        this.emitChange();
    }

    /**
     * Set all roles visible/hidden for a variable.
     */
    setRowAll(varKey: string, visible: boolean): void {
        for (const role of this.roles) {
            if (!role.variableWhitelist) {
                role.variableWhitelist = [];
            }

            if (visible) {
                // Add to whitelist if not present (or expand if empty)
                if (role.variableWhitelist.length === 0) {
                    // Empty = all, so already visible. Set explicit list.
                    role.variableWhitelist = [...this.variableKeys];
                } else if (!role.variableWhitelist.includes(varKey)) {
                    role.variableWhitelist.push(varKey);
                }
            } else {
                // Remove from whitelist
                if (role.variableWhitelist.length === 0) {
                    // Empty = all visible, so set to all except this one
                    role.variableWhitelist = this.variableKeys.filter(k => k !== varKey);
                } else {
                    const idx = role.variableWhitelist.indexOf(varKey);
                    if (idx >= 0) {
                        role.variableWhitelist.splice(idx, 1);
                    }
                }
            }
        }
        this.emitChange();
    }

    /**
     * Set all variables visible/hidden for a role.
     */
    setColumnAll(roleIndex: number, visible: boolean): void {
        const role = this.roles[roleIndex];
        if (!role) return;

        if (visible) {
            // All visible = empty whitelist (uses default behavior)
            role.variableWhitelist = [];
        } else {
            // None visible = empty array (but we need a way to distinguish...)
            // Since empty = all, we use a special marker or just remove all keys
            // For "none", we set an explicit empty array but we'll need a flag
            // For now, let's set it to an array that explicitly has no matching keys
            role.variableWhitelist = ['__NONE__'];
        }
        this.emitChange();
    }

    close(): void {
        this.closeModal.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    private emitChange(): void {
        this.rolesChange.emit([...this.roles]);
    }
}
