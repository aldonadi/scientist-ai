import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HealthStatus {
    status: 'ok' | 'error' | 'loading';
    database: string;
    providers: { name: string; status: string }[];
}

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div class="flex items-center">
        <span class="text-gray-500 text-sm">Status:</span>
        <span [class]="statusClass" class="ml-2 px-2 py-1 rounded text-xs font-medium">
          {{ health.status === 'ok' ? 'ONLINE' : health.status === 'loading' ? 'CHECKING...' : 'OFFLINE' }}
        </span>
      </div>
      
      <div class="flex items-center space-x-4">
        <button class="text-gray-600 hover:text-gray-900">
          <span class="text-lg">🔔</span>
        </button>
        <div class="flex items-center">
          <span class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            A
          </span>
          <span class="ml-2 text-sm text-gray-700">Admin</span>
        </div>
        <button class="text-gray-600 hover:text-gray-900">
          <span class="text-lg">⚙️</span>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
    health: HealthStatus = {
        status: 'loading',
        database: 'unknown',
        providers: []
    };

    private intervalId: any;

    get statusClass(): string {
        switch (this.health.status) {
            case 'ok': return 'bg-green-100 text-green-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    }

    ngOnInit(): void {
        this.checkHealth();
        // Poll health every 30 seconds
        this.intervalId = setInterval(() => this.checkHealth(), 30000);
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private async checkHealth(): Promise<void> {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                this.health = await response.json();
            } else {
                this.health.status = 'error';
            }
        } catch {
            this.health.status = 'error';
        }
    }
}
