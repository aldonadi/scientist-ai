import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToolService, Tool } from '../../core/services/tool.service';

@Component({
  selector: 'app-tool-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Tools Library</h1>
        <a routerLink="/tools/new" 
           class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          (+) Create Tool
        </a>
      </div>
      
      <!-- Search and Filter -->
      <div class="flex items-center space-x-4">
        <div class="flex-1 relative">
          <input type="text" 
                 [(ngModel)]="searchQuery"
                 (input)="filterTools()"
                 placeholder="Search tools..."
                 class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <select [(ngModel)]="selectedNamespace" 
                (change)="filterTools()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Namespaces</option>
          <option *ngFor="let ns of namespaces" [value]="ns">{{ ns }}</option>
        </select>
      </div>
      
      <!-- Tools Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Namespace</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let tool of filteredTools" 
                class="hover:bg-gray-50 transition-colors group">
              <td class="px-6 py-4">
                <a [routerLink]="['/tools', tool._id]" 
                   class="text-blue-600 hover:text-blue-800 font-medium"
                   (mouseenter)="showPreview($event, tool)"
                   (mouseleave)="hidePreview()">
                    {{ tool.name }}
                </a>
              </td>
              <td class="px-6 py-4 text-gray-600">{{ tool.namespace }}</td>
              <td class="px-6 py-4 text-gray-500 text-sm">{{ formatDate(tool.updatedAt) }}</td>
              <td class="px-6 py-4 text-right">
                <a [routerLink]="['/tools', tool._id]" 
                   class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4">
                  Edit
                </a>
                <button (click)="deleteTool(tool)" 
                        class="text-red-600 hover:text-red-800 text-sm font-medium">
                  Del
                </button>
              </td>
            </tr>
            
            <tr *ngIf="filteredTools.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                No tools found. Create your first tool!
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div *ngIf="totalTools > pageSize" 
             class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span class="text-sm text-gray-500">
            Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalTools) }} of {{ totalTools }}
          </span>
          <div class="flex items-center space-x-2">
            <button (click)="prevPage()" 
                    [disabled]="currentPage === 1"
                    class="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              &lt;
            </button>
            <span *ngFor="let page of pages" 
                  (click)="goToPage(page)"
                  class="px-3 py-1 rounded text-sm cursor-pointer"
                  [class.bg-blue-600]="page === currentPage"
                  [class.text-white]="page === currentPage">
              {{ page }}
            </span>
            <button (click)="nextPage()" 
                    [disabled]="currentPage === totalPages"
                    class="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Position Tooltip (rendered outside overflow container) -->
    <div *ngIf="previewTool"
         class="fixed z-[9999] w-max max-w-[80vw] max-h-[60vh] bg-gray-900 text-green-400 p-4 rounded-lg shadow-xl font-mono text-xs whitespace-pre overflow-auto pointer-events-none"
         [style.left.px]="tooltipX"
         [style.top.px]="tooltipY">
      <div class="text-gray-500 mb-2">[PREVIEW]</div>
      {{ getPreviewCode(previewTool) }}
    </div>
  `
})
export class ToolListComponent implements OnInit {
  tools: Tool[] = [];
  filteredTools: Tool[] = [];
  namespaces: string[] = [];

  searchQuery = '';
  selectedNamespace = '';

  previewTool: Tool | null = null;
  tooltipX = 0;
  tooltipY = 0;

  currentPage = 1;
  pageSize = 50;
  totalTools = 0;

  Math = Math;

  constructor(private toolService: ToolService) { }

  ngOnInit(): void {
    const savedNamespace = localStorage.getItem('toolList_namespace');
    if (savedNamespace) {
      this.selectedNamespace = savedNamespace;
    }
    this.loadTools();
  }

  get totalPages(): number {
    return Math.ceil(this.totalTools / this.pageSize);
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) {
      pages.push(i);
    }
    return pages;
  }

  loadTools(): void {
    this.toolService.getTools().subscribe({
      next: (tools) => {
        this.tools = tools;
        this.totalTools = tools.length;
        this.namespaces = [...new Set(tools.map(t => t.namespace))];
        this.filterTools();
      },
      error: (err) => console.error('Failed to load tools:', err)
    });
  }

  filterTools(): void {
    let filtered = this.tools;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    if (this.selectedNamespace) {
      filtered = filtered.filter(t => t.namespace === this.selectedNamespace);
    }

    // Save selection
    if (this.selectedNamespace) {
      localStorage.setItem('toolList_namespace', this.selectedNamespace);
    } else {
      localStorage.removeItem('toolList_namespace');
    }

    this.totalTools = filtered.length;
    const start = (this.currentPage - 1) * this.pageSize;
    this.filteredTools = filtered.slice(start, start + this.pageSize);
  }

  showPreview(event: MouseEvent, tool: Tool): void {
    this.previewTool = tool;
    this.updateTooltipPosition(event);
  }

  hidePreview(): void {
    this.previewTool = null;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.previewTool) {
      this.updateTooltipPosition(event);
    }
  }

  private updateTooltipPosition(event: MouseEvent): void {
    const tooltipWidth = 384; // w-96 = 24rem = 384px
    const tooltipHeight = 300; // Approximate max height
    const padding = 16;

    // Start position: to the right and slightly below cursor
    let x = event.clientX + padding;
    let y = event.clientY + padding;

    // Check right edge - if tooltip would overflow, show on left side of cursor
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = event.clientX - tooltipWidth - padding;
    }

    // Check bottom edge - if tooltip would overflow, show above cursor
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = window.innerHeight - tooltipHeight - padding;
    }

    // Ensure we don't go past top edge
    if (y < padding) {
      y = padding;
    }

    // Ensure we don't go past left edge
    if (x < padding) {
      x = padding;
    }

    this.tooltipX = x;
    this.tooltipY = y;
  }

  getPreviewCode(tool: Tool): string {
    const lines = tool.code.split('\n').slice(0, 15);
    return lines.join('\n');
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString();
  }

  deleteTool(tool: Tool): void {
    if (confirm(`Delete tool "${tool.namespace}/${tool.name}"?`)) {
      this.toolService.deleteTool(tool._id).subscribe({
        next: () => this.loadTools(),
        error: (err) => console.error('Failed to delete tool:', err)
      });
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterTools();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterTools();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.filterTools();
  }
}
