import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToolService, Tool, CreateToolDto } from '../../core/services/tool.service';

const DEFAULT_TOOL_CODE = `def execute(env, args):
    """
    Description of what this tool does.
    
    Args:
        arg_name (type): Description of argument
        
    Returns:
        dict: Result of execution (must be JSON serializable)
    """
    # Access environment state variables (if needed)
    # stock_data = env.get('stock_data', {})
    
    # Access arguments passed by the model
    # param = args.get('arg_name')

    # Your implementation here
    
    # Return a dictionary, list, or primitive that can be serialized to JSON
    # This result will be passed back to the model
    return {"status": "success", "data": "..."}`;

@Component({
  selector: 'app-tool-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <button (click)="goBack()" class="mr-4 text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? 'Create Tool' : 'Edit Tool' }}
          </h1>
        </div>
        <div class="flex items-center space-x-3">
          <button (click)="goBack()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button (click)="save()" 
                  [disabled]="!isValid()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </div>
      
      <!-- Split Pane Editor -->
      <div class="flex-1 flex gap-6 min-h-0">
        <!-- Left: Metadata -->
        <div class="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-auto">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Namespace *</label>
              <input type="text" 
                     [(ngModel)]="tool.namespace"
                     placeholder="e.g., finance_v1"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" 
                     [(ngModel)]="tool.name"
                     placeholder="e.g., get_stock_quote"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea [(ngModel)]="tool.description"
                        rows="3"
                        placeholder="What does this tool do?"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-gray-700">Parameters (JSON Schema)</label>
                <button (click)="generateSchema()" 
                        class="text-xs text-blue-600 hover:text-blue-800">
                  Auto-generate from code
                </button>
              </div>
              <textarea [(ngModel)]="parametersJson"
                        rows="8"
                        placeholder='{"type": "object", "properties": {...}}'
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        [class.border-red-500]="parametersError"></textarea>
              <p *ngIf="parametersError" class="mt-1 text-xs text-red-600">{{ parametersError }}</p>
            </div>
          </div>
        </div>
        
        <!-- Right: Code Editor -->
        <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Python Code</h2>
            <span class="text-xs text-gray-500">The execute(env, args) function is the entry point</span>
          </div>
          <div class="flex-1 relative">
            <textarea [(ngModel)]="tool.code"
                      class="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none"
                      spellcheck="false"></textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ToolEditorComponent implements OnInit {
  @Input() id?: string;

  isNew = true;
  tool: CreateToolDto = {
    namespace: '',
    name: '',
    description: '',
    parameters: {},
    code: ''
  };

  parametersJson = '{}';
  parametersError = '';

  constructor(
    private toolService: ToolService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Get ID from route if not provided via input
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId && routeId !== 'new') {
      this.id = routeId;
      this.isNew = false;
      this.loadTool();
    } else {
      // New tool: pre-populate code
      this.tool.code = DEFAULT_TOOL_CODE;
    }
  }

  loadTool(): void {
    if (!this.id) return;

    this.toolService.getTool(this.id).subscribe({
      next: (tool) => {
        this.tool = {
          namespace: tool.namespace,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          code: tool.code
        };
        this.parametersJson = JSON.stringify(tool.parameters, null, 2);
      },
      error: (err) => {
        console.error('Failed to load tool:', err);
        this.router.navigate(['/tools']);
      }
    });
  }

  isValid(): boolean {
    return !!(this.tool.namespace && this.tool.name && this.tool.description && this.tool.code);
  }

  validateParameters(): boolean {
    try {
      this.tool.parameters = JSON.parse(this.parametersJson);
      this.parametersError = '';
      return true;
    } catch (e) {
      this.parametersError = 'Invalid JSON';
      return false;
    }
  }

  generateSchema(): void {
    // Parse Python code to extract function signature and docstring
    const code = this.tool.code;
    const schema: any = {
      type: 'object',
      properties: {},
      required: []
    };

    // Simple regex to find Args in docstring
    const argsMatch = code.match(/Args:\s*([\s\S]*?)(?:Returns:|$)/);
    if (argsMatch) {
      const argsSection = argsMatch[1];
      const argLines = argsSection.split('\\n').filter(l => l.trim());

      for (const line of argLines) {
        // Match pattern: param_name (type): description
        const match = line.match(/^\s*(\w+)\s*\((\w+)\):\s*(.+)/);
        if (match) {
          const [, name, type, description] = match;
          schema.properties[name] = {
            type: type === 'str' ? 'string' : type === 'int' ? 'integer' : type === 'bool' ? 'boolean' : type,
            description: description.trim()
          };
          schema.required.push(name);
        }
      }
    }

    this.parametersJson = JSON.stringify(schema, null, 2);
    this.tool.parameters = schema;
  }

  save(): void {
    if (!this.validateParameters()) return;

    const action = this.isNew
      ? this.toolService.createTool(this.tool)
      : this.toolService.updateTool(this.id!, this.tool);

    action.subscribe({
      next: () => this.router.navigate(['/tools']),
      error: (err) => console.error('Failed to save tool:', err)
    });
  }

  goBack(): void {
    this.router.navigate(['/tools']);
  }
}
