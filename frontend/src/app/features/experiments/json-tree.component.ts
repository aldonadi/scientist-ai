import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="font-mono text-xs">
      <ng-container *ngIf="data !== undefined && data !== null; else emptyState">
        <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: data, key: null, depth: 0 }"></ng-container>
      </ng-container>
      
      <ng-template #emptyState>
        <span class="text-gray-400 italic">No data</span>
      </ng-template>
      
      <ng-template #nodeTemplate let-value let-key="key" let-depth="depth">
        <div [style.paddingLeft.px]="depth * 16" class="py-0.5">
          <!-- Object -->
          <ng-container *ngIf="isObject(value) && !isArray(value)">
            <span *ngIf="key !== null" class="text-purple-600">{{ key }}: </span>
            <span 
              class="cursor-pointer hover:bg-gray-100 rounded px-1"
              (click)="toggle(getPath(key, depth))">
              <span class="text-gray-400">{{ isExpanded(getPath(key, depth)) ? '▼' : '▶' }}</span>
              <span class="text-gray-500">{{ '{' }}{{ getObjectKeys(value).length }} keys{{ '}' }}</span>
            </span>
            <div *ngIf="isExpanded(getPath(key, depth))">
              <ng-container *ngFor="let k of getObjectKeys(value)">
                <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: value[k], key: k, depth: depth + 1 }"></ng-container>
              </ng-container>
            </div>
          </ng-container>
          
          <!-- Array -->
          <ng-container *ngIf="isArray(value)">
            <span *ngIf="key !== null" class="text-purple-600">{{ key }}: </span>
            <span 
              class="cursor-pointer hover:bg-gray-100 rounded px-1"
              (click)="toggle(getPath(key, depth))">
              <span class="text-gray-400">{{ isExpanded(getPath(key, depth)) ? '▼' : '▶' }}</span>
              <span class="text-gray-500">[{{ value.length }} items]</span>
            </span>
            <div *ngIf="isExpanded(getPath(key, depth))">
              <ng-container *ngFor="let item of value; let i = index">
                <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: item, key: i, depth: depth + 1 }"></ng-container>
              </ng-container>
            </div>
          </ng-container>
          
          <!-- Primitive: String -->
          <ng-container *ngIf="isString(value)">
            <span *ngIf="key !== null" class="text-purple-600">{{ key }}: </span>
            <span class="text-green-600 cursor-pointer hover:bg-green-50 rounded px-1" (click)="openModal(value, key || 'Value')">"{{ truncate(value) }}"</span>
          </ng-container>
          
          <!-- Primitive: Number -->
          <ng-container *ngIf="isNumber(value)">
            <span *ngIf="key !== null" class="text-purple-600">{{ key }}: </span>
            <span class="text-blue-600">{{ value }}</span>
          </ng-container>
          
          <!-- Primitive: Boolean -->
          <ng-container *ngIf="isBoolean(value)">
            <span *ngIf="key !== null" class="text-purple-600">{{ key }}: </span>
            <span class="text-orange-600">{{ value }}</span>
          </ng-container>
          
          <!-- Null -->
          <ng-container *ngIf="value === null">
            <span *ngIf="key !== null" class="text-purple-600">{{ key }}: </span>
            <span class="text-gray-400 italic">null</span>
          </ng-container>
        </div>
      </ng-template>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" (click)="closeModal()">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 w-3/4 max-w-4xl max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                <h3 class="text-lg font-semibold text-gray-900 font-mono">{{ modalTitle }}</h3>
                <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div class="p-6 overflow-auto font-mono text-xs whitespace-pre-wrap flex-1 bg-white">
                {{ modalContent }}
            </div>
        </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class JsonTreeComponent {
  @Input() data: any;
  @Input() expandedByDefault = true;

  private expandedPaths = new Set<string>();
  private initialized = false;

  private initializeExpansion(): void {
    if (!this.initialized && this.data && this.expandedByDefault) {
      // Expand first level by default
      this.expandedPaths.add('root');
      if (this.isObject(this.data)) {
        Object.keys(this.data).forEach(k => this.expandedPaths.add(`root.${k}`));
      }
      this.initialized = true;
    }
  }

  isExpanded(path: string): boolean {
    this.initializeExpansion();
    return this.expandedPaths.has(path);
  }

  toggle(path: string): void {
    if (this.expandedPaths.has(path)) {
      this.expandedPaths.delete(path);
    } else {
      this.expandedPaths.add(path);
    }
  }

  getPath(key: string | number | null, depth: number): string {
    if (depth === 0) return 'root';
    return `root.${key}`;
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isString(value: any): boolean {
    return typeof value === 'string';
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  truncate(value: string, maxLength = 100): string {
    if (value.length > maxLength) {
      return value.substring(0, maxLength) + '...';
    }
    return value;
  }

  // Modal Logic
  showModal = false;
  modalTitle = '';
  modalContent = '';

  openModal(content: any, title: string) {
    this.modalContent = String(content);
    this.modalTitle = title;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
