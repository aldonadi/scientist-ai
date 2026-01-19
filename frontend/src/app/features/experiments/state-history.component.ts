import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExperimentService, ExperimentStateHistory } from '../../core/services/experiment.service';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'app-state-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Toolbar -->
      <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h2 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span class="text-lg">📈</span> State History
        </h2>

        <div class="flex items-center gap-2">
           <!-- Column Management -->
           <div class="flex items-center gap-2 text-sm">
             <input 
                type="text" 
                [(ngModel)]="newColumnKey" 
                placeholder="Add column (e.g. user.name)" 
                class="px-2 py-1 border border-gray-300 rounded text-xs w-48"
                (keyup.enter)="addColumn(newColumnKey)">
             <button (click)="addColumn(newColumnKey)" class="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
               +
             </button>
             <button (click)="resetColumns()" class="text-xs text-gray-500 hover:text-gray-700 underline ml-2">
               Reset Defaults
             </button>
           </div>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="toggleSort()" class="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
             <span class="text-xs">{{ sortAscending ? 'Wait, 1 → N' : 'Latest First' }}</span>
             <span class="text-gray-400">⇅</span>
          </button>
          
          <div class="h-4 w-px bg-gray-300 mx-2"></div>
          
          <button (click)="exportCSV()" class="text-sm font-medium text-green-600 hover:text-green-800 flex items-center gap-1">
            <span>Download CSV</span>
            <span class="text-lg">📥</span>
          </button>
        </div>
      </div>

      <!-- Active Columns Tags -->
      <div class="px-4 py-2 border-b border-gray-100 bg-white flex flex-wrap gap-2 text-xs">
          <span class="text-gray-400 py-1">Visible Columns:</span>
          <span *ngFor="let col of columns" class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1 border border-gray-200">
            {{ col }}
            <button (click)="removeColumn(col)" class="text-gray-400 hover:text-red-500 font-bold ml-1">×</button>
          </span>
      </div>

      <!-- Table Container with Horizontal Scroll -->
      <div class="flex-1 overflow-auto bg-white relative custom-scrollbar">
        <table class="w-full text-sm text-left border-collapse">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" class="px-4 py-3 border-b border-gray-200 w-20 font-bold text-center">Step</th>
              <th scope="col" class="px-4 py-3 border-b border-gray-200 w-32 text-gray-500">Time</th>
              <th *ngFor="let col of columns" scope="col" class="px-4 py-3 border-b border-gray-200 font-medium min-w-[150px]">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of sortedHistory; let even = even" [class.bg-gray-50]="even" class="hover:bg-blue-50 transition-colors">
              <td class="px-4 py-3 font-bold text-gray-900 text-center border-r border-gray-100">{{ row.stepNumber }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs border-r border-gray-100 font-mono">{{ formatTime(row.timestamp) }}</td>
              <td *ngFor="let col of columns" class="px-4 py-3 border-r border-gray-100 last:border-0 font-mono text-gray-700 truncate max-w-xs " [title]="getValue(row.environment, col)">
                 {{ formatValue(getValue(row.environment, col)) }}
              </td>
            </tr>
            <tr *ngIf="sortedHistory.length === 0">
               <td [attr.colspan]="columns.length + 2" class="px-4 py-8 text-center text-gray-400">
                  No history data available yet.
               </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class StateHistoryComponent implements OnInit, OnDestroy, OnChanges {
    @Input() experimentId?: string;
    @Input() isRunning: boolean = false;

    history: ExperimentStateHistory[] = [];
    sortedHistory: ExperimentStateHistory[] = [];

    columns: string[] = [];
    newColumnKey: string = '';
    sortAscending: boolean = true;

    private pollSubscription?: Subscription;
    private readonly STORAGE_KEY = 'scientist-ai-history-columns';

    constructor(private experimentService: ExperimentService) { }

    ngOnInit(): void {
        this.loadColumnConfig();
        if (this.experimentId) {
            this.fetchHistory();
            this.startPolling();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['experimentId'] && !changes['experimentId'].firstChange) {
            this.fetchHistory();
        }
        if (changes['isRunning']) {
            if (this.isRunning) {
                this.startPolling();
            } else {
                this.stopPolling(); // Don't stop immediately if we want to keep checking for final updates? Nah, stop is fine.
            }
        }
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    startPolling() {
        this.stopPolling();
        if (this.isRunning && this.experimentId) {
            this.pollSubscription = interval(5000).subscribe(() => {
                this.fetchHistory();
            });
        }
    }

    stopPolling() {
        if (this.pollSubscription) {
            this.pollSubscription.unsubscribe();
            this.pollSubscription = undefined;
        }
    }

    fetchHistory() {
        if (!this.experimentId) return;
        this.experimentService.getHistory(this.experimentId).subscribe({
            next: (data) => {
                this.history = data;
                this.updateSortedHistory();

                // If we have no columns configured and generic data exists, init defaults
                if (this.columns.length === 0 && data.length > 0) {
                    this.initDefaultColumns(data);
                }
            },
            error: (err) => console.error('Failed to fetch history', err)
        });
    }

    updateSortedHistory() {
        this.sortedHistory = [...this.history].sort((a, b) => {
            return this.sortAscending ? a.stepNumber - b.stepNumber : b.stepNumber - a.stepNumber;
        });
    }

    toggleSort() {
        this.sortAscending = !this.sortAscending;
        this.updateSortedHistory();
    }

    // --- Column Management ---

    loadColumnConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.columns = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved columns', e);
            }
        }
    }

    saveColumnConfig() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.columns));
    }

    initDefaultColumns(data: ExperimentStateHistory[]) {
        // Find the entry with the most keys
        const allKeys = new Set<string>();
        // Sample last 5 steps to find keys
        data.slice(-5).forEach(step => {
            if (step.environment) {
                Object.keys(step.environment).forEach(k => allKeys.add(k));
            }
        });

        // Take first 15 keys alphabetically
        this.columns = Array.from(allKeys).sort().slice(0, 15);
        this.saveColumnConfig(); // Save these as default preference? Or maybe not? Let's save.
    }

    resetColumns() {
        this.columns = [];
        this.localStorage.removeItem(this.STORAGE_KEY);
        this.fetchHistory(); // Re-trigger default init logic
    }

    // Fix for previous line: this.localStorage is wrong, should be localStorage

    addColumn(key: string) {
        if (key && !this.columns.includes(key)) {
            this.columns.push(key);
            this.saveColumnConfig();
            this.newColumnKey = '';
        }
    }

    removeColumn(key: string) {
        this.columns = this.columns.filter(c => c !== key);
        this.saveColumnConfig();
    }

    // --- Helpers ---

    getValue(obj: any, path: string): any {
        if (!obj) return undefined;
        return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
    }

    formatValue(val: any): string {
        if (val === undefined || val === null) return '-';
        if (typeof val === 'object') return JSON.stringify(val); // Simplistic, but works for now.
        if (typeof val === 'string' && val.length > 50) return val.substring(0, 50) + '...';
        return String(val);
    }

    formatTime(ts: string): string {
        const d = new Date(ts);
        return d.toTimeString().split(' ')[0]; // HH:MM:SS
    }

    exportCSV() {
        if (this.sortedHistory.length === 0) return;

        const headers = ['Step', 'Time', ...this.columns];
        const rows = this.sortedHistory.map(row => {
            return [
                row.stepNumber,
                new Date(row.timestamp).toISOString(),
                ...this.columns.map(col => {
                    let val = this.getValue(row.environment, col);
                    if (typeof val === 'object') val = JSON.stringify(val).replace(/"/g, '""'); // Escape quotes
                    if (typeof val === 'string') val = `"${val}"`; // Quote strings
                    return val ?? '';
                })
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `experiment_${this.experimentId}_history.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper for fix
    get localStorage() {
        return localStorage;
    }
}
