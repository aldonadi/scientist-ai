import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../core/services/plan.service';
import { ToolService, Tool } from '../../../core/services/tool.service';

@Component({
  selector: 'app-roles-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Agents</h2>
          <p class="text-sm text-gray-500">Will be run in the order listed</p>
        </div>
        <button (click)="addRole()" 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
          (+) Add Role
        </button>
      </div>
      
      <!-- Roles Table -->
      <table class="w-full mb-6">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-12">#</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Role Name</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Model</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Tools</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let role of roles; let i = index" 
              class="border-b border-gray-100 cursor-move"
              draggable="true"
              (dragstart)="onDragStart($event, i)"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event, i)">
            <td class="py-3 text-gray-400">
              <span class="cursor-move">☰</span> {{ i + 1 }}
            </td>
            <td class="py-3">
              <button (click)="editRole(i)" 
                      class="text-blue-600 hover:text-blue-800 font-medium">
                {{ role.name || 'Unnamed Role' }}
              </button>
            </td>
            <td class="py-3 text-gray-600">{{ role.modelConfig.modelName || 'Not set' }}</td>
            <td class="py-3 text-gray-600">{{ role.tools.length || 0 }}</td>
            <td class="py-3 text-right">
              <button (click)="editRole(i)" class="text-blue-600 hover:text-blue-800 text-sm mr-4">Edit</button>
              <button (click)="removeRole(i)" class="text-red-600 hover:text-red-800 text-sm">Del</button>
            </td>
          </tr>
          
          <tr *ngIf="roles.length === 0">
            <td colspan="5" class="py-8 text-center text-gray-500">
              No roles defined. Add your first agent role!
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Role Editor Panel -->
      <div *ngIf="editingIndex !== null" class="border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-md font-semibold text-gray-900">
            Editing: {{ editingRole.name || 'New Role' }}
          </h3>
          <button (click)="closeEditor()" class="text-gray-500 hover:text-gray-700">
            ✕ Close
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
            <input type="text" 
                   [(ngModel)]="editingRole.name"
                   (ngModelChange)="onRoleChange()"
                   placeholder="e.g., StockPicker"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
            <textarea [(ngModel)]="editingRole.systemPrompt"
                      (ngModelChange)="onRoleChange()"
                      rows="4"
                      placeholder="You are an expert stock picker..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select [(ngModel)]="editingRole.modelConfig.provider"
                      (ngModelChange)="onRoleChange()"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="ollama">Ollama</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" 
                     [(ngModel)]="editingRole.modelConfig.modelName"
                     (ngModelChange)="onRoleChange()"
                     placeholder="e.g., llama3, gpt-4"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          
          <!-- Tool Chips -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Selected Tools</label>
            <div class="flex flex-wrap gap-2 mb-3">
              <span *ngFor="let toolId of editingRole.tools; let ti = index"
                    class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    [title]="getToolDescription(toolId)">
                {{ getToolName(toolId) }}
                <button (click)="removeTool(ti)" class="ml-2 text-blue-500 hover:text-blue-700">×</button>
              </span>
              <span *ngIf="editingRole.tools.length === 0" class="text-gray-400 italic text-sm">
                No tools selected
              </span>
            </div>
            
            <!-- Tool Search -->
            <div class="relative">
              <input type="text" 
                     [(ngModel)]="toolSearch"
                     (input)="searchTools()"
                     (focus)="showToolDropdown = true"
                     placeholder="Search tools to add..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              
              <div *ngIf="showToolDropdown && filteredTools.length > 0"
                   class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                <button *ngFor="let tool of filteredTools"
                        (click)="addTool(tool)"
                        class="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">
                  <span class="font-medium">{{ tool.namespace }}/{{ tool.name }}</span>
                  <span class="text-gray-500 ml-2">{{ tool.description | slice:0:50 }}...</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RolesTabComponent {
  @Input() roles: Role[] = [];
  @Output() rolesChange = new EventEmitter<Role[]>();

  editingIndex: number | null = null;
  editingRole: Role = this.createEmptyRole();

  allTools: Tool[] = [];
  filteredTools: Tool[] = [];
  toolSearch = '';
  showToolDropdown = false;

  private draggedIndex: number | null = null;

  constructor(private toolService: ToolService) {
    this.loadTools();
  }

  createEmptyRole(): Role {
    return {
      name: '',
      modelConfig: { provider: 'ollama', modelName: '', temperature: 0.7 },
      systemPrompt: '',
      tools: [],
      variableWhitelist: []
    };
  }

  loadTools(): void {
    this.toolService.getTools().subscribe({
      next: (tools: Tool[]) => this.allTools = tools,
      error: (err: Error) => console.error('Failed to load tools:', err)
    });
  }

  addRole(): void {
    const newRole = this.createEmptyRole();
    this.roles.push(newRole);
    this.editingIndex = this.roles.length - 1;
    this.editingRole = newRole;
    this.emitChange();
  }

  editRole(index: number): void {
    this.editingIndex = index;
    this.editingRole = this.roles[index];
  }

  closeEditor(): void {
    this.editingIndex = null;
    this.editingRole = this.createEmptyRole();
  }

  removeRole(index: number): void {
    if (confirm(`Remove role "${this.roles[index].name}"?`)) {
      this.roles.splice(index, 1);
      if (this.editingIndex === index) {
        this.closeEditor();
      }
      this.emitChange();
    }
  }

  onRoleChange(): void {
    if (this.editingIndex !== null) {
      this.roles[this.editingIndex] = { ...this.editingRole };
      this.emitChange();
    }
  }

  // Drag and Drop
  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
    event.dataTransfer?.setData('text/plain', String(index));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
      const [removed] = this.roles.splice(this.draggedIndex, 1);
      this.roles.splice(targetIndex, 0, removed);
      this.emitChange();
    }
    this.draggedIndex = null;
  }

  // Tool Management
  searchTools(): void {
    this.showToolDropdown = true;
    const query = this.toolSearch.toLowerCase();
    this.filteredTools = this.allTools.filter(t =>
      !this.editingRole.tools.includes(t._id) &&
      (t.name.toLowerCase().includes(query) ||
        t.namespace.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query))
    ).slice(0, 5);
  }

  addTool(tool: Tool): void {
    if (!this.editingRole.tools.includes(tool._id)) {
      this.editingRole.tools.push(tool._id);
      this.onRoleChange();
    }
    this.toolSearch = '';
    this.showToolDropdown = false;
    this.filteredTools = [];
  }

  removeTool(index: number): void {
    this.editingRole.tools.splice(index, 1);
    this.onRoleChange();
  }

  getToolName(toolId: string): string {
    const tool = this.allTools.find(t => t._id === toolId);
    return tool ? `${tool.namespace}/${tool.name}` : toolId;
  }

  getToolDescription(toolId: string): string {
    const tool = this.allTools.find(t => t._id === toolId);
    return tool?.description || '';
  }

  private emitChange(): void {
    this.rolesChange.emit([...this.roles]);
  }
}
