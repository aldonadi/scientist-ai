import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToolService, Tool, CreateToolDto } from '../../core/services/tool.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { CanComponentDeactivate } from '../../core/guards/unsaved-changes.guard';
import { isValidPythonIdentifier, getPythonIdentifierError, validateJson, checkPythonSyntax } from '../../core/utils/validation.utils';

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
            {{ isNew ? 'Create Tool' : 'Edit Tool: ' + tool.name }}
          </h1>
          <span *ngIf="isDirty()" class="ml-3 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
             ● Unsaved Changes
          </span>
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
                     (ngModelChange)="validateNamespace()"
                     placeholder="e.g., finance_v1"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="namespaceError"
                     [class.border-gray-300]="!namespaceError">
              <p *ngIf="namespaceError" class="mt-1 text-xs text-red-600">{{ namespaceError }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" 
                     [(ngModel)]="tool.name"
                     (ngModelChange)="validateName()"
                     placeholder="e.g., get_stock_quote"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="nameError"
                     [class.border-gray-300]="!nameError">
              <p *ngIf="nameError" class="mt-1 text-xs text-red-600">{{ nameError }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea [(ngModel)]="tool.description"
                        rows="3"
                        placeholder="What does this tool do?"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>

            <div class="flex items-center pt-2">
                <input type="checkbox" 
                       id="endsTurn"
                       [(ngModel)]="tool.endsTurn"
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="endsTurn" class="ml-2 block text-sm text-gray-900">
                    Ends Turn
                    <p class="text-gray-500 text-xs font-normal">If checked, the agent's turn usually ends after calling this tool. Uncheck to allow chaining.</p>
                </label>
            </div>
            
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-gray-700">Parameters (JSON Schema)</label>
                <div class="flex items-center space-x-1">
                  <button (click)="generateSchema()" 
                          class="text-xs text-blue-600 hover:text-blue-800">
                    Auto-generate from code
                  </button>
                  <button (click)="showSchemaHelp = !showSchemaHelp"
                          class="w-4 h-4 rounded-full text-xs flex items-center justify-center transition-colors"
                          [class.bg-blue-500]="showSchemaHelp"
                          [class.text-white]="showSchemaHelp"
                          [class.bg-gray-200]="!showSchemaHelp"
                          [class.text-gray-600]="!showSchemaHelp"
                          [class.hover:bg-gray-300]="!showSchemaHelp"
                          title="Click for help">
                    ?
                  </button>
                </div>
              </div>
              
              <!-- Help Tooltip -->
              <div *ngIf="showSchemaHelp" 
                   class="mb-2 p-3 bg-blue-100 border border-blue-300 rounded-lg text-xs text-blue-900 shadow-sm">
                <p class="font-medium mb-2">Auto-generate parses your docstring's Args section:</p>
                <pre class="bg-white p-2 rounded border border-blue-200 text-xs overflow-x-auto text-gray-800">def execute(env, args):
    """
    Args:
        symbol (str): Stock ticker symbol
        limit (int): Max results
    """</pre>
                <p class="mt-2">
                  Format: <code class="bg-blue-200 px-1 rounded">param_name (type): description</code><br>
                  Supported types: <code class="bg-blue-200 px-1 rounded">str</code>, 
                  <code class="bg-blue-200 px-1 rounded">int</code>, 
                  <code class="bg-blue-200 px-1 rounded">bool</code>
                </p>
              </div>
              
              <textarea [(ngModel)]="parametersJson"
                        (ngModelChange)="validateParameters()"
                        rows="8"
                        placeholder='{"type": "object", "properties": {...}}'
                        class="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        [class.border-red-500]="parametersError"
                        [class.border-gray-300]="!parametersError"></textarea>
              <p *ngIf="parametersError" class="mt-1 text-xs text-red-600">{{ parametersError }}</p>
            </div>
          </div>
        </div>
        
        <!-- Right: Code Editor -->
        <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Python Code</h2>
            <div class="flex items-center space-x-2">
              <span *ngIf="codeError" class="text-xs text-red-600">{{ codeError }}</span>
              <span class="text-xs text-gray-500">The execute(env, args) function is the entry point</span>
            </div>
          </div>
          <div class="flex-1 relative">
            <textarea [(ngModel)]="tool.code"
                      (ngModelChange)="validateCode()"
                      class="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none"
                      [class.border-2]="codeError"
                      [class.border-red-500]="codeError"
                      spellcheck="false"></textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ToolEditorComponent implements OnInit, CanComponentDeactivate {
  @Input() id?: string;

  isNew = true;
  tool: CreateToolDto = {
    namespace: '',
    name: '',
    description: '',
    parameters: {},
    code: '',
    endsTurn: true
  };

  parametersJson = '{}';
  showSchemaHelp = false;

  // Validation errors
  namespaceError = '';
  nameError = '';
  parametersError = '';
  codeError = '';

  // Dirty checking
  private initialToolState: string = '';
  private bypassGuard = false;

  constructor(
    private toolService: ToolService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
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
      this.saveInitialState();
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
          code: tool.code,
          endsTurn: tool.endsTurn !== undefined ? tool.endsTurn : true
        };
        this.parametersJson = JSON.stringify(tool.parameters, null, 2);
        this.saveInitialState();
      },
      error: (err) => {
        console.error('Failed to load tool:', err);
        this.router.navigate(['/tools']);
      }
    });
  }

  saveInitialState(): void {
    this.initialToolState = JSON.stringify(this.getCleanToolObject());
  }

  getCleanToolObject(): any {
    return {
      namespace: this.tool.namespace,
      name: this.tool.name,
      description: this.tool.description,
      parameters: this.tool.parameters,
      code: this.tool.code,
      endsTurn: this.tool.endsTurn,
      parametersJson: this.parametersJson
    };
  }

  isDirty(): boolean {
    const currentState = JSON.stringify(this.getCleanToolObject());
    return this.initialToolState !== currentState;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.bypassGuard) {
      return true;
    }
    if (this.isDirty()) {
      return this.confirmService.confirm({
        title: 'Unsaved Changes',
        message: `You have unsaved changes to "${this.tool.name || 'this tool'}".\n\nDo you want to leave without saving?`,
        confirmText: 'Leave',
        cancelText: 'Stay'
      });
    }
    return true;
  }

  async goBack(): Promise<void> {
    if (this.isDirty()) {
      const shouldDiscard = await this.confirmService.confirm({
        title: 'Discard Changes?',
        message: `You have unsaved changes to "${this.tool.name || 'this tool'}".\n\nDo you want to discard these changes?`,
        confirmText: 'Discard',
        cancelText: 'Keep Editing'
      });
      if (shouldDiscard) {
        this.bypassGuard = true;
        this.router.navigate(['/tools']);
      }
    } else {
      this.router.navigate(['/tools']);
    }
  }

  validateNamespace(): void {
    this.namespaceError = getPythonIdentifierError(this.tool.namespace) || '';
  }

  validateName(): void {
    this.nameError = getPythonIdentifierError(this.tool.name) || '';
  }

  validateParameters(): boolean {
    const result = validateJson(this.parametersJson);
    if (result.valid) {
      try {
        this.tool.parameters = this.parametersJson.trim() ? JSON.parse(this.parametersJson) : {};
        this.parametersError = '';
        return true;
      } catch (e) {
        this.parametersError = 'Invalid JSON';
        return false;
      }
    } else {
      this.parametersError = result.error || 'Invalid JSON';
      return false;
    }
  }

  validateCode(): void {
    const result = checkPythonSyntax(this.tool.code);
    this.codeError = result.valid ? '' : (result.error || '');
  }

  isValid(): boolean {
    // Run all validations
    const namespaceValid = isValidPythonIdentifier(this.tool.namespace);
    const nameValid = isValidPythonIdentifier(this.tool.name);
    const descriptionValid = !!this.tool.description;
    const codeValid = !!this.tool.code;
    const paramsValid = !this.parametersError;

    return namespaceValid && nameValid && descriptionValid && codeValid && paramsValid;
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
    this.parametersError = '';
  }

  save(): void {
    if (!this.validateParameters()) return;

    const action = this.isNew
      ? this.toolService.createTool(this.tool)
      : this.toolService.updateTool(this.id!, this.tool);

    action.subscribe({
      next: () => {
        this.toastService.success('Tool Saved Successfully');
        this.saveInitialState(); // Update initial state after save
        this.bypassGuard = true;
        this.router.navigate(['/tools']);
      },
      error: (err) => {
        console.error('Failed to save tool:', err);
        this.toastService.error('Failed to save tool: ' + (err.error?.message || err.message));
      }
    });
  }
}
