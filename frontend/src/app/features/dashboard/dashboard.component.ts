import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Experiment {
    id: string;
    name: string;
    status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
    step: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="space-y-6">
      <!-- Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Active Experiments</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ activeExperiments }}</p>
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
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div class="divide-y divide-gray-100">
          <div *ngFor="let exp of recentExperiments" 
               class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div class="flex items-center">
              <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    [ngClass]="{
                      'bg-blue-100 text-blue-600': exp.status === 'RUNNING',
                      'bg-yellow-100 text-yellow-600': exp.status === 'PAUSED',
                      'bg-green-100 text-green-600': exp.status === 'COMPLETED',
                      'bg-red-100 text-red-600': exp.status === 'FAILED'
                    }">
                {{ exp.status === 'RUNNING' ? '▶' : exp.status === 'PAUSED' ? '⏸' : exp.status === 'COMPLETED' ? '✓' : '✕' }}
              </span>
              <div class="ml-4">
                <p class="font-medium text-gray-900">[{{ exp.id }}] "{{ exp.name }}"</p>
                <p class="text-sm text-gray-500">Step {{ exp.step }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-blue-100 text-blue-700': exp.status === 'RUNNING',
                      'bg-yellow-100 text-yellow-700': exp.status === 'PAUSED',
                      'bg-green-100 text-green-700': exp.status === 'COMPLETED',
                      'bg-red-100 text-red-700': exp.status === 'FAILED'
                    }">
                {{ exp.status }}
              </span>
              <a [routerLink]="['/experiments', exp.id]" 
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
export class DashboardComponent implements OnInit {
    activeExperiments = 0;
    systemHealth = '-- %';
    queuedCount = 0;
    recentExperiments: Experiment[] = [];

    ngOnInit(): void {
        this.loadDashboardData();
    }

    private async loadDashboardData(): Promise<void> {
        try {
            // Fetch experiments
            const expResponse = await fetch('/api/experiments');
            if (expResponse.ok) {
                const experiments = await expResponse.json();
                this.recentExperiments = experiments.slice(0, 5);
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
