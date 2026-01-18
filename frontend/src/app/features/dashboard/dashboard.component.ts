import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface RecentExperiment {
  _id: string;
  planId: string;
  planName: string;
  status: 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  currentStep: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all"
             [class.cursor-pointer]="activeExperiments > 0"
             [class.hover:shadow-md]="activeExperiments > 0"
             [class.hover:border-blue-200]="activeExperiments > 0"
             [routerLink]="activeExperiments > 0 ? ['/experiments'] : null"
             [queryParams]="activeExperiments > 0 ? { status: 'RUNNING' } : null">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Active Experiments</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ activeExperiments }}</p>
              <p *ngIf="activeExperiments > 0" class="text-xs text-blue-600 mt-1">Click to view →</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">🧪</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">System Health</p>
              <p class="text-3xl font-bold text-green-600 mt-1">{{ systemHealth }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">✓</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Queued</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ queuedCount }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Start -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 class="text-xl font-semibold mb-2">Quick Start</h2>
        <p class="text-blue-100 mb-4">Launch a new experiment from an existing plan</p>
        <button routerLink="/plans" 
                class="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
          (+) Start New Experiment
        </button>
      </div>
      
      <!-- Recent Activity -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <span class="text-xs text-gray-400">Auto-refreshes every 30s</span>
        </div>
        <div class="divide-y divide-gray-100">
          <div *ngFor="let exp of recentExperiments" 
               class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div class="flex items-center">
              <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    [ngClass]="{
                      'bg-blue-100 text-blue-600': exp.status === 'RUNNING',
                      'bg-yellow-100 text-yellow-600': exp.status === 'PAUSED' || exp.status === 'INITIALIZING',
                      'bg-green-100 text-green-600': exp.status === 'COMPLETED',
                      'bg-red-100 text-red-600': exp.status === 'FAILED' || exp.status === 'STOPPED'
                    }">
                {{ getStatusIcon(exp.status) }}
              </span>
              <div class="ml-4">
                <p class="font-medium text-gray-900">{{ exp.planName }}</p>
                <p class="text-xs text-gray-400">ID: {{ exp._id }} · Step {{ exp.currentStep }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-blue-100 text-blue-700': exp.status === 'RUNNING',
                      'bg-yellow-100 text-yellow-700': exp.status === 'PAUSED' || exp.status === 'INITIALIZING',
                      'bg-green-100 text-green-700': exp.status === 'COMPLETED',
                      'bg-red-100 text-red-700': exp.status === 'FAILED' || exp.status === 'STOPPED'
                    }">
                {{ exp.status }}
              </span>
              <a [routerLink]="['/experiments', exp._id]" 
                 class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View
              </a>
            </div>
          </div>
          
          <div *ngIf="recentExperiments.length === 0" class="p-8 text-center text-gray-500">
            No recent experiments. Start one from a Plan!
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeExperiments = 0;
  systemHealth = '-- %';
  queuedCount = 0;
  recentExperiments: RecentExperiment[] = [];

  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds

  ngOnInit(): void {
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, this.REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'RUNNING': return '▶';
      case 'PAUSED': return '⏸';
      case 'INITIALIZING': return '⏳';
      case 'COMPLETED': return '✓';
      case 'FAILED':
      case 'STOPPED': return '✕';
      default: return '?';
    }
  }

  private async loadDashboardData(): Promise<void> {
    try {
      // Fetch experiments and plans in parallel
      const [expResponse, plansResponse] = await Promise.all([
        fetch('/api/experiments'),
        fetch('/api/plans')
      ]);

      let planNameMap: { [id: string]: string } = {};

      if (plansResponse.ok) {
        const plans = await plansResponse.json();
        plans.forEach((plan: any) => {
          planNameMap[plan._id] = plan.name;
        });
      }

      if (expResponse.ok) {
        const experiments = await expResponse.json();

        // Sort by most recent first (using startTime or createdAt)
        const sorted = experiments.sort((a: any, b: any) => {
          const dateA = new Date(a.startTime || a.createdAt || 0);
          const dateB = new Date(b.startTime || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // Map to include plan names
        this.recentExperiments = sorted.slice(0, 5).map((exp: any) => ({
          _id: exp._id,
          planId: exp.planId,
          planName: planNameMap[exp.planId] || 'Unknown Plan',
          status: exp.status,
          currentStep: exp.currentStep || 0
        }));

        this.activeExperiments = experiments.filter((e: any) => e.status === 'RUNNING').length;
        this.queuedCount = experiments.filter((e: any) => e.status === 'INITIALIZING').length;
      }

      // Fetch health
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        this.systemHealth = health.status === 'ok' ? '100% OK' : 'DEGRADED';
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }
}
