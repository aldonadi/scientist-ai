import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, Script } from '../../../core/services/plan.service';

const LIFECYCLE_EVENTS = [
    { id: 'EXPERIMENT_START', label: 'EXPERIMENT_START', description: 'Fires when the experiment begins' },
    { id: 'STEP_START', label: 'STEP_START', description: 'Fires at the beginning of each step' },
    { id: 'ROLE_START', label: 'ROLE_START', description: 'Fires when a role begins processing' },
    { id: 'MODEL_PROMPT', label: 'MODEL_PROMPT', description: 'Fires before sending prompt to model' },
    { id: 'MODEL_RESPONSE_CHUNK', label: 'MODEL_RESPONSE_CHUNK', description: 'Fires for each streaming chunk' },
    { id: 'MODEL_RESPONSE_COMPLETE', label: 'MODEL_RESPONSE_COMPLETE', description: 'Fires when model response is complete' },
    { id: 'BEFORE_TOOL_CALL', label: 'BEFORE_TOOL_CALL', description: 'Fires before a tool is executed' },
    { id: 'TOOL_CALL', label: 'TOOL_CALL', description: 'Fires when a tool is called' },
    { id: 'TOOL_RESULT', label: 'TOOL_RESULT', description: 'Fires after tool execution completes' },
    { id: 'AFTER_TOOL_CALL', label: 'AFTER_TOOL_CALL', description: 'Fires after tool result is processed' },
    { id: 'STEP_END', label: 'STEP_END', description: 'Fires at the end of each step' },
    { id: 'EXPERIMENT_END', label: 'EXPERIMENT_END', description: 'Fires when the experiment completes' }
];

@Component({
    selector: 'app-workflow-tab',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="flex gap-6 h-full">
      <!-- Left: Goals Section -->
      <div class="w-1/2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Goals (Termination Conditions)</h2>
          <button (click)="addGoal()" 
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium">
            (+) Add Goal
          </button>
        </div>
        
        <div class="space-y-4">
          <div *ngFor="let goal of goals; let i = index" 
               class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-start justify-between mb-2">
              <span class="text-sm text-gray-500">Goal {{ i + 1 }}</span>
              <button (click)="removeGoal(i)" class="text-red-600 hover:text-red-800 text-sm">Del</button>
            </div>
            <input type="text" 
                   [(ngModel)]="goal.conditionScript"
                   (ngModelChange)="emitGoals()"
                   placeholder="Env.money > 10000 (Python Expression)"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <input type="text" 
                   [(ngModel)]="goal.description"
                   (ngModelChange)="emitGoals()"
                   placeholder="Description (e.g., Profit Target Reached)"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          
          <div *ngIf="goals.length === 0" class="text-center text-gray-500 py-8">
            No goals defined. Add termination conditions.
          </div>
        </div>
      </div>
      
      <!-- Right: Lifecycle Hooks -->
      <div class="w-1/2 flex gap-4">
        <!-- Event List -->
        <div class="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-auto">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">LIFECYCLE EVENTS</h3>
          <ul class="space-y-1">
            <li *ngFor="let event of lifecycleEvents"
                (click)="selectEvent(event.id)"
                class="px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors"
                [class.bg-blue-100]="selectedEvent === event.id"
                [class.text-blue-700]="selectedEvent === event.id"
                [class.hover:bg-gray-100]="selectedEvent !== event.id"
                [class.font-bold]="getScriptCount(event.id) > 0">
              <span *ngIf="getScriptCount(event.id) > 0" class="text-blue-600">
                ({{ getScriptCount(event.id) }} {{ getScriptCount(event.id) === 1 ? 'script' : 'scripts' }})
              </span>
              {{ event.label }}
            </li>
          </ul>
        </div>
        
        <!-- Script Editor -->
        <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-auto">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-900">HOOK: {{ selectedEvent }}</h3>
              <p *ngIf="getEventDescription()" class="text-xs text-gray-500">
                {{ getEventDescription() }}
              </p>
            </div>
          </div>
          
          <!-- Scripts for selected event -->
          <div class="space-y-4">
            <div *ngFor="let script of getEventScripts(); let i = index"
                 class="border border-gray-200 rounded-lg p-3"
                 draggable="true"
                 (dragstart)="onScriptDragStart($event, i)"
                 (dragover)="onScriptDragOver($event)"
                 (drop)="onScriptDrop($event, i)">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <span class="cursor-move text-gray-400 mr-2">☰</span>
                  <span class="text-sm text-gray-700">Script {{ i + 1 }}</span>
                </div>
                <button (click)="removeScript(i)" class="text-red-600 hover:text-red-800 text-xs">Del</button>
              </div>
              
              <div class="flex gap-2 mb-2">
                <select [(ngModel)]="script.executionMode"
                        (ngModelChange)="emitScripts()"
                        class="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="SYNC">Sync</option>
                  <option value="ASYNC">Async</option>
                </select>
                <select [(ngModel)]="script.failPolicy"
                        (ngModelChange)="emitScripts()"
                        class="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="ABORT_EXPERIMENT">Abort on Error</option>
                  <option value="CONTINUE_WITH_ERROR">Continue on Error</option>
                </select>
              </div>
              
              <textarea [(ngModel)]="script.code"
                        (ngModelChange)="emitScripts()"
                        rows="6"
                        placeholder="def run(context):
    # Your code here
    pass"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs bg-gray-900 text-green-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            
            <button (click)="addScript()" 
                    class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm">
              (+) Add Script
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WorkflowTabComponent {
    @Input() goals: Goal[] = [];
    @Input() scripts: Script[] = [];
    @Output() goalsChange = new EventEmitter<Goal[]>();
    @Output() scriptsChange = new EventEmitter<Script[]>();

    lifecycleEvents = LIFECYCLE_EVENTS;
    selectedEvent = 'STEP_START';

    private draggedScriptIndex: number | null = null;

    selectEvent(eventId: string): void {
        this.selectedEvent = eventId;
    }

    getEventDescription(): string {
        return this.lifecycleEvents.find(e => e.id === this.selectedEvent)?.description || '';
    }

    getScriptCount(eventId: string): number {
        return this.scripts.filter(s => s.hookType === eventId).length;
    }

    getEventScripts(): Script[] {
        return this.scripts.filter(s => s.hookType === this.selectedEvent);
    }

    // Goals
    addGoal(): void {
        this.goals.push({ description: '', conditionScript: '' });
        this.emitGoals();
    }

    removeGoal(index: number): void {
        this.goals.splice(index, 1);
        this.emitGoals();
    }

    emitGoals(): void {
        this.goalsChange.emit([...this.goals]);
    }

    // Scripts
    addScript(): void {
        this.scripts.push({
            hookType: this.selectedEvent,
            code: 'def run(context):\n    # Your code here\n    pass',
            failPolicy: 'ABORT_EXPERIMENT',
            executionMode: 'SYNC'
        });
        this.emitScripts();
    }

    removeScript(index: number): void {
        const eventScripts = this.getEventScripts();
        const actualIndex = this.scripts.indexOf(eventScripts[index]);
        if (actualIndex !== -1) {
            this.scripts.splice(actualIndex, 1);
            this.emitScripts();
        }
    }

    onScriptDragStart(event: DragEvent, index: number): void {
        this.draggedScriptIndex = index;
        event.dataTransfer?.setData('text/plain', String(index));
    }

    onScriptDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onScriptDrop(event: DragEvent, targetIndex: number): void {
        event.preventDefault();
        if (this.draggedScriptIndex !== null && this.draggedScriptIndex !== targetIndex) {
            const eventScripts = this.getEventScripts();
            const fromScript = eventScripts[this.draggedScriptIndex];
            const toScript = eventScripts[targetIndex];

            const fromActual = this.scripts.indexOf(fromScript);
            const toActual = this.scripts.indexOf(toScript);

            if (fromActual !== -1 && toActual !== -1) {
                const [removed] = this.scripts.splice(fromActual, 1);
                this.scripts.splice(toActual, 0, removed);
                this.emitScripts();
            }
        }
        this.draggedScriptIndex = null;
    }

    emitScripts(): void {
        this.scriptsChange.emit([...this.scripts]);
    }
}
