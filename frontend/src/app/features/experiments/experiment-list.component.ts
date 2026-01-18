import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ExperimentService, Experiment } from '../../core/services/experiment.service';

type ExperimentStatus = 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'STOPPED';

@Component({
  selector: 'app-experiment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Experiments</h1>
        <span class="text-xs text-gray-400">Auto-refreshes every 30s</span>
      </div>

      <!-- Status Filter Buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          (click)="setStatusFilter(null)"
          [class]="statusFilter === null 
            ? 'bg-gray-900 text-white' 
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors">
          All
        </button>
        <button
          *ngFor="let status of availableStatuses"
          (click)="setStatusFilter(status)"
          [class]="statusFilter === status 
            ? getActiveFilterClass(status)
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors">
          {{ status }}
        </button>
      </div>
      
      <div *ngIf="filteredExperiments.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p class="text-gray-500 mb-4">
          {{ statusFilter ? 'No ' + statusFilter + ' experiments found.' : 'No experiments found.' }}
        </p>
        <a routerLink="/plans" class="text-blue-600 hover:text-blue-800">
          Go to Plans to launch an experiment
        </a>
      </div>

      <div *ngIf="filteredExperiments.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let experiment of filteredExperiments"
                [class.bg-green-50]="experiment.status === 'RUNNING'">
              <td class="px-6 py-4 whitespace-nowrap">
                <span [ngClass]="{
                  'bg-yellow-100 text-yellow-800': experiment.status === 'INITIALIZING',
                  'bg-blue-100 text-blue-800': experiment.status === 'RUNNING',
                  'bg-green-100 text-green-800': experiment.status === 'COMPLETED',
                  'bg-red-100 text-red-800': experiment.status === 'FAILED',
                  'bg-orange-100 text-orange-800': experiment.status === 'PAUSED',
                  'bg-gray-100 text-gray-800': experiment.status === 'STOPPED'
                }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ experiment.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ experiment._id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ experiment.planId }}
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ experiment.startTime | date:'medium' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                 <a [routerLink]="['/experiments', experiment._id]" class="text-indigo-600 hover:text-indigo-900">View</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ExperimentListComponent implements OnInit, OnDestroy {
  experiments: Experiment[] = [];
  statusFilter: ExperimentStatus | null = null;
  availableStatuses: ExperimentStatus[] = ['RUNNING', 'COMPLETED', 'FAILED', 'PAUSED', 'STOPPED'];

  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds

  constructor(
    private experimentService: ExperimentService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Read status filter from query params
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status && this.availableStatuses.includes(status)) {
        this.statusFilter = status as ExperimentStatus;
      }
    });
    this.loadExperiments();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadExperiments();
    }, this.REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadExperiments(): void {
    this.experimentService.getExperiments().subscribe({
      next: (experiments) => {
        // Sort: RUNNING experiments first, then by startTime descending
        this.experiments = experiments.sort((a, b) => {
          if (a.status === 'RUNNING' && b.status !== 'RUNNING') return -1;
          if (a.status !== 'RUNNING' && b.status === 'RUNNING') return 1;
          // Both same status, sort by startTime descending
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });
      },
      error: (error) => {
        console.error('Error loading experiments', error);
      }
    });
  }

  setStatusFilter(status: ExperimentStatus | null): void {
    this.statusFilter = status;
  }

  get filteredExperiments(): Experiment[] {
    if (!this.statusFilter) {
      return this.experiments;
    }
    return this.experiments.filter(exp => exp.status === this.statusFilter);
  }

  getActiveFilterClass(status: ExperimentStatus): string {
    const classes: Record<ExperimentStatus, string> = {
      'RUNNING': 'bg-blue-600 text-white',
      'COMPLETED': 'bg-green-600 text-white',
      'FAILED': 'bg-red-600 text-white',
      'PAUSED': 'bg-orange-500 text-white',
      'STOPPED': 'bg-gray-600 text-white',
      'INITIALIZING': 'bg-yellow-500 text-white'
    };
    return classes[status] || 'bg-gray-900 text-white';
  }
}
