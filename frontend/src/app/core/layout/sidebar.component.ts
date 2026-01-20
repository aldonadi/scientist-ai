import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside 
      class="bg-gray-900 text-gray-100 flex flex-col h-full transition-all duration-300 ease-in-out"
      [class.w-64]="!collapsed"
      [class.w-16]="collapsed">
      
      <!-- Header with toggle button -->
      <div class="p-4 border-b border-gray-700 flex items-center" [class.justify-center]="collapsed">
        <button 
          (click)="toggle()" 
          class="text-gray-400 hover:text-white transition-colors focus:outline-none"
          [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <span class="text-lg">{{ collapsed ? '☰' : '✕' }}</span>
        </button>
        <div *ngIf="!collapsed" class="ml-3 overflow-hidden whitespace-nowrap">
          <h1 class="text-xl font-bold text-white">SCIENTIST.AI</h1>
          <span class="text-xs text-gray-400">v1.0</span>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 p-2">
        <ul class="space-y-1">
          <li>
            <a routerLink="/dashboard" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
               [class.justify-center]="collapsed"
               [title]="collapsed ? 'Dashboard' : ''">
              <span class="text-lg">📊</span>
              <span *ngIf="!collapsed" class="ml-3 whitespace-nowrap overflow-hidden">Dashboard</span>
            </a>
          </li>
          <li>
            <a routerLink="/plans" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
               [class.justify-center]="collapsed"
               [title]="collapsed ? 'Plans' : ''">
              <span class="text-lg">📋</span>
              <span *ngIf="!collapsed" class="ml-3 whitespace-nowrap overflow-hidden">Plans</span>
            </a>
          </li>
          <li>
            <a routerLink="/tools" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
               [class.justify-center]="collapsed"
               [title]="collapsed ? 'Tools' : ''">
              <span class="text-lg">🔧</span>
              <span *ngIf="!collapsed" class="ml-3 whitespace-nowrap overflow-hidden">Tools</span>
            </a>
          </li>
          <li>
            <a routerLink="/experiments" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
               [class.justify-center]="collapsed"
               [title]="collapsed ? 'Experiments' : ''">
              <span class="text-lg">🧪</span>
              <span *ngIf="!collapsed" class="ml-3 whitespace-nowrap overflow-hidden">Experiments</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <!-- Footer with Settings -->
      <div class="p-2 border-t border-gray-700">
        <a routerLink="/settings" 
           routerLinkActive="bg-blue-600 text-white"
           class="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
           [class.justify-center]="collapsed"
           [title]="collapsed ? 'Settings' : ''">
          <span class="text-lg">⚙️</span>
          <span *ngIf="!collapsed" class="ml-3 whitespace-nowrap overflow-hidden">Settings</span>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class SidebarComponent {
  collapsed = false;

  toggle(): void {
    this.collapsed = !this.collapsed;
  }
}
