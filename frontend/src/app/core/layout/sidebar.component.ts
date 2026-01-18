import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
    <aside class="w-64 bg-gray-900 text-gray-100 flex flex-col h-full">
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-bold text-white">SCIENTIST.AI</h1>
        <span class="text-xs text-gray-400">v1.0</span>
      </div>
      
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <a routerLink="/dashboard" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <span class="mr-3">📊</span>
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/plans" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <span class="mr-3">📋</span>
              Plans
            </a>
          </li>
          <li>
            <a routerLink="/tools" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <span class="mr-3">🔧</span>
              Tools
            </a>
          </li>
          <li>
            <a routerLink="/experiments" 
               routerLinkActive="bg-blue-600 text-white"
               class="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <span class="mr-3">🧪</span>
              Experiments
            </a>
          </li>
        </ul>
      </nav>
      
      <div class="p-4 border-t border-gray-700">
        <a routerLink="/settings" 
           class="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          <span class="mr-3">⚙️</span>
          Settings
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent { }
