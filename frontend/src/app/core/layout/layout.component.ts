import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, HeaderComponent],
    template: `
    <div class="flex h-screen bg-gray-100">
      <app-sidebar></app-sidebar>
      
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-header></app-header>
        
        <main class="flex-1 overflow-auto p-6">
          <router-outlet></router-outlet>
        </main>
        
        <footer class="h-10 bg-white border-t border-gray-200 flex items-center justify-between px-6 text-xs text-gray-500">
          <span>Copyright (c) 2026 Andrew Wilson, Scientist.AI</span>
          <div class="space-x-4">
            <a href="#" class="hover:text-gray-700">About</a>
            <a href="#" class="hover:text-gray-700">Help</a>
          </div>
        </footer>
      </div>
    </div>
  `
})
export class LayoutComponent { }
