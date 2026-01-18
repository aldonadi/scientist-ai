import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExperimentService, Experiment } from '../../core/services/experiment.service';
import { PlanService, ExperimentPlan } from '../../core/services/plan.service';
import { LogFeedComponent, LogEntry } from './log-feed.component';
import { JsonTreeComponent } from './json-tree.component';
import { interval, Subscription } from 'rxjs';

interface RoleActivity {
  roleName: string;
  status: 'thinking' | 'tool_call' | 'complete';
  message?: string;
  toolName?: string;
  timestamp: string;
}

@Component({
  selector: 'app-experiment-monitor',
  standalone: true,
  imports: [CommonModule, RouterLink, LogFeedComponent, JsonTreeComponent],
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 shrink-0">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="text-gray-500 hover:text-gray-700 transition-colors">
            ← Back
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Experiment Monitor</h1>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>{{ id }}</span>
              <span *ngIf="planName" class="text-gray-300">|</span>
              <a *ngIf="planName" 
                 [routerLink]="['/plans', experiment?.planId]" 
                 class="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer">
                {{ planName }}
              </a>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Status Badge -->
          <div class="flex items-center gap-3">
            <span 
              class="px-3 py-1 rounded-full text-sm font-semibold"
              [ngClass]="getStatusClass()">
              {{ experiment?.status || 'LOADING' }}
            </span>
            <span class="text-gray-600 font-medium">
              Step {{ experiment?.currentStep || 0 }}
            </span>
          </div>
          
          <!-- Controls -->
          <div class="flex items-center gap-2">
            <button 
              *ngIf="experiment?.status === 'RUNNING'"
              (click)="control('pause')"
              [disabled]="isControlling"
              class="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50">
              ⏸ Pause
            </button>
            <button 
              *ngIf="experiment?.status === 'PAUSED'"
              (click)="control('resume')"
              [disabled]="isControlling"
              class="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
              ▶ Resume
            </button>
            <button 
              *ngIf="experiment?.status === 'RUNNING' || experiment?.status === 'PAUSED'"
              (click)="control('stop')"
              [disabled]="isControlling"
              class="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
              ⏹ Stop
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center gap-1 mb-4 border-b border-gray-200">
          <button 
            (click)="activeTab = 'monitor'"
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            [ngClass]="activeTab === 'monitor' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            Monitor View
          </button>
          <button 
            (click)="activeTab = 'chat'"
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            [ngClass]="activeTab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            Chat History
          </button>
      </div>
      
      <!-- Monitor View (Original 3-Panel) -->
      <div *ngIf="activeTab === 'monitor'" class="flex-1 grid grid-cols-3 gap-4 min-h-0">
        <!-- Left Panel: Log Feed -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h2 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span class="text-lg">📋</span> Live Log Feed
              <span class="text-gray-400 font-normal">({{ logs.length }})</span>
            </h2>
          </div>
          <div class="flex-1 min-h-0">
            <app-log-feed [logs]="logs"></app-log-feed>
          </div>
        </div>
        
        <!-- Center Panel: Role Activity -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h2 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span class="text-lg">🤖</span> Role Activity
            </h2>
          </div>
          <div class="flex-1 p-4 overflow-auto">
            <div *ngIf="roleActivities.length === 0" class="text-gray-400 text-sm text-center py-8">
              No role activity yet...
            </div>
            <div *ngFor="let activity of roleActivities" class="mb-4 last:mb-0">
              <div class="flex items-center gap-2 mb-1">
                <span 
                  class="w-2 h-2 rounded-full animate-pulse"
                  [ngClass]="{
                    'bg-blue-500': activity.status === 'thinking',
                    'bg-green-500': activity.status === 'tool_call',
                    'bg-gray-400': activity.status === 'complete'
                  }">
                </span>
                <span class="font-semibold text-gray-900">{{ activity.roleName }}</span>
                <span class="text-xs text-gray-400">{{ formatTime(activity.timestamp) }}</span>
              </div>
              <div class="ml-4 text-sm text-gray-600">
                <span *ngIf="activity.status === 'thinking'" class="italic">Thinking...</span>
                <span *ngIf="activity.status === 'tool_call'">
                  Calling tool: <span class="font-mono text-green-600">{{ activity.toolName }}</span>
                </span>
                <span *ngIf="activity.message">{{ activity.message }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right Panel: Environment Inspector -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h2 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span class="text-lg">🔧</span> Environment
            </h2>
          </div>
          <div class="flex-1 p-4 overflow-auto">
            <app-json-tree [data]="experiment?.currentEnvironment"></app-json-tree>
          </div>
        </div>
      </div>

      <!-- Chat History View -->
      <div *ngIf="activeTab === 'chat'" class="flex-1 flex gap-4 min-h-0">
          <!-- Sidebar: Role List -->
          <div class="w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
             <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
               <h2 class="text-sm font-semibold text-gray-900">Roles</h2>
             </div>
             <div class="flex-1 overflow-y-auto">
                 <button 
                    *ngFor="let role of getRoleList()"
                    (click)="selectedRole = role"
                    class="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    [ngClass]="selectedRole === role ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'">
                    {{ role }}
                    <span *ngIf="experiment?.roleHistory?.[role]" class="text-xs text-gray-400 ml-2">
                        ({{ experiment!.roleHistory![role].length }})
                    </span>
                 </button>
                 <div *ngIf="getRoleList().length === 0" class="p-4 text-sm text-gray-400 text-center">
                     No roles found
                 </div>
             </div>
          </div>

          <!-- Chat Area -->
          <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
                  <h2 class="text-sm font-semibold text-gray-900">
                      {{ selectedRole ? 'Chat History: ' + selectedRole : 'Select a Role' }}
                  </h2>
              </div>
              <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                  <ng-container *ngIf="selectedRole && getSelectedHistory().length > 0; else noChat">
                      <div *ngFor="let msg of getSelectedHistory()" class="flex flex-col">
                          
                          <!-- System Message -->
                          <div *ngIf="msg.role === 'system'" class="self-center bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full mb-2">
                              Output Format: {{ msg.content | slice:0:50 }}...
                          </div>

                          <!-- User Message (Experiment Step Prompt) -->
                          <div *ngIf="msg.role === 'user'" class="self-end max-w-2xl">
                              <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                                  <div class="text-xs text-blue-200 mb-1 font-mono">STEP PROMPT</div>
                                  <pre class="whitespace-pre-wrap font-sans text-sm">{{ msg.content }}</pre>
                              </div>
                              <div class="text-right text-xs text-gray-400 mt-1">{{ formatTime(msg.timestamp) }}</div>
                          </div>

                          <!-- Assistant Message (Response) -->
                          <div *ngIf="msg.role === 'assistant'" class="self-start max-w-2xl w-full">
                              <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                  <div class="text-xs text-gray-400 mb-1 font-bold">{{ selectedRole }}</div>
                                  <div class="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">{{ msg.content }}</div>
                                  
                                  <!-- Render Tool Calls inside Assistant msg if any -->
                                  <div *ngIf="msg.tool_calls && msg.tool_calls.length > 0" class="mt-3 space-y-2">
                                      <div *ngFor="let call of msg.tool_calls" class="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-mono">
                                          <div class="text-gray-500 font-semibold">🛠 Tool Call: {{ call.function.name }}</div>
                                          <div class="truncate text-gray-400">{{ call.function.arguments | json }}</div>
                                      </div>
                                  </div>
                              </div>
                              <div class="text-left text-xs text-gray-400 mt-1">{{ formatTime(msg.timestamp) }}</div>
                          </div>

                          <!-- Tool Result Message -->
                          <div *ngIf="msg.role === 'tool'" class="self-start max-w-2xl w-full pl-8 opacity-75">
                              <div class="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono text-gray-600">
                                  <div class="flex items-center gap-2 mb-1">
                                      <span>⚙️ Tool Result</span>
                                      <!-- <span class="font-bold">{{ msg.name }}</span> -->
                                  </div>
                                  <div class="whitespace-pre-wrap break-all">{{ msg.content }}</div>
                              </div>
                          </div>

                      </div>
                  </ng-container>
                  <ng-template #noChat>
                      <div class="h-full flex items-center justify-center text-gray-400">
                          {{ selectedRole ? 'No history for this role yet.' : 'Please select a role from the sidebar.' }}
                      </div>
                  </ng-template>
              </div>
          </div>
      </div>
      
      <!-- Result Banner (when complete) -->
      <div 
        *ngIf="experiment?.status === 'COMPLETED' || experiment?.status === 'FAILED' || experiment?.status === 'STOPPED'"
        class="mt-4 p-4 rounded-lg shrink-0"
        [ngClass]="{
          'bg-green-50 border border-green-200': experiment?.status === 'COMPLETED',
          'bg-red-50 border border-red-200': experiment?.status === 'FAILED',
          'bg-gray-50 border border-gray-200': experiment?.status === 'STOPPED'
        }">
        <div class="flex items-center gap-3">
          <span class="text-2xl">
            {{ experiment?.status === 'COMPLETED' ? '✅' : experiment?.status === 'FAILED' ? '❌' : '⏹' }}
          </span>
          <div>
            <p class="font-semibold" [ngClass]="{
              'text-green-800': experiment?.status === 'COMPLETED',
              'text-red-800': experiment?.status === 'FAILED',
              'text-gray-800': experiment?.status === 'STOPPED'
            }">
              Experiment {{ experiment?.status }}
            </p>
            <p class="text-sm text-gray-600">{{ experiment?.result || 'No result message' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class ExperimentMonitorComponent implements OnInit, OnDestroy {
  @Input() id?: string;

  experiment: Experiment | null = null;
  plan: ExperimentPlan | null = null;
  planName?: string;
  logs: LogEntry[] = [];
  roleActivities: RoleActivity[] = [];
  isControlling = false;
  activeTab: 'monitor' | 'chat' = 'monitor';
  selectedRole: string | null = null;

  private pollSubscription?: Subscription;
  private readonly POLL_INTERVAL = 2000; // 2 seconds

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private experimentService: ExperimentService,
    private planService: PlanService
  ) { }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.id = routeId;
      this.loadExperiment();
      this.loadLogs();
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadExperiment(): void {
    if (!this.id) return;

    this.experimentService.getExperiment(this.id).subscribe({
      next: (exp) => {
        this.experiment = exp;
        if (!this.planName && exp.planId) {
          this.loadPlan(exp.planId);
        }
      },
      error: (err) => {
        console.error('Failed to load experiment:', err);
      }
    });
  }

  loadPlan(planId: string): void {
    this.planService.getPlan(planId).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.planName = plan.name;
        // Default select first role if none selected
        if (!this.selectedRole && plan.roles.length > 0) {
          this.selectedRole = plan.roles[0].name;
        }
      },
      error: (err) => {
        console.error('Failed to load plan:', err);
      }
    });
  }

  getRoleList(): string[] {
    if (this.plan) {
      return this.plan.roles.map(r => r.name);
    }
    // Fallback if plan not loaded but we have history keys
    if (this.experiment?.roleHistory) {
      return Object.keys(this.experiment.roleHistory);
    }
    return [];
  }

  getSelectedHistory() {
    if (!this.experiment?.roleHistory || !this.selectedRole) return [];
    // roleHistory is a plain object from JSON, not a Map here
    return this.experiment.roleHistory[this.selectedRole] || [];
  }

  loadLogs(): void {
    if (!this.id) return;

    this.experimentService.getLogs(this.id, 500).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.extractRoleActivities(logs);
      },
      error: (err) => {
        console.error('Failed to load logs:', err);
      }
    });
  }

  extractRoleActivities(logs: LogEntry[]): void {
    // Extract role-related activities from logs
    const activities: RoleActivity[] = [];

    for (const log of logs) {
      const source = log.source.toLowerCase();

      if (source.includes('role')) {
        if (log.message.toLowerCase().includes('thinking') || log.message.toLowerCase().includes('prompt')) {
          activities.push({
            roleName: this.extractRoleName(log.source),
            status: 'thinking',
            timestamp: log.timestamp
          });
        } else if (log.message.toLowerCase().includes('complete') || log.message.toLowerCase().includes('response')) {
          activities.push({
            roleName: this.extractRoleName(log.source),
            status: 'complete',
            message: log.message,
            timestamp: log.timestamp
          });
        }
      }

      if (source.includes('tool') || log.message.toLowerCase().includes('tool call')) {
        const toolMatch = log.message.match(/tool[:\s]+(\w+)/i) || log.data?.toolName;
        activities.push({
          roleName: 'Agent',
          status: 'tool_call',
          toolName: toolMatch?.[1] || log.data?.toolName || 'unknown',
          timestamp: log.timestamp
        });
      }
    }

    // Keep only the last 10 activities
    this.roleActivities = activities.slice(-10).reverse();
  }

  extractRoleName(source: string): string {
    // Try to extract role name from source like "Role:StockPicker"
    const match = source.match(/role[:\s]*(\w+)/i);
    return match?.[1] || source;
  }

  startPolling(): void {
    this.pollSubscription = interval(this.POLL_INTERVAL).subscribe(() => {
      if (this.experiment?.status === 'RUNNING' || this.experiment?.status === 'PAUSED' || this.experiment?.status === 'INITIALIZING') {
        this.loadExperiment();
        this.loadLogs();
      } else {
        // Experiment is done, stop polling
        this.stopPolling();
      }
    });
  }

  stopPolling(): void {
    this.pollSubscription?.unsubscribe();
  }

  control(command: 'pause' | 'resume' | 'stop'): void {
    if (!this.id || this.isControlling) return;

    this.isControlling = true;
    this.experimentService.controlExperiment(this.id, command).subscribe({
      next: (exp) => {
        this.experiment = exp;
        this.isControlling = false;
      },
      error: (err) => {
        console.error('Failed to control experiment:', err);
        this.isControlling = false;
      }
    });
  }

  getStatusClass(): string {
    switch (this.experiment?.status) {
      case 'INITIALIZING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'STOPPED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/experiments']);
  }
}
