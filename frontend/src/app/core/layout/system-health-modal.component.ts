import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HealthStatus {
    status: 'ok' | 'error' | 'loading';
    timestamp: Date;
    uptime: number;
    service: string;
    database: {
        status: string;
        host: string;
        name: string;
    };
    containers: {
        poolSize: number;
        available: number;
        active: number;
        image: string;
    };
}

@Component({
    selector: 'app-system-health-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm" (click)="onBackdropClick($event)">
      <!-- Modal Window -->
      <div class="bg-gray-900 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] text-green-400 font-mono w-full max-w-2xl transform transition-all p-0 overflow-hidden rounded-md" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="bg-green-900/20 border-b border-green-500/50 px-6 py-3 flex justify-between items-center">
          <h2 class="text-xl font-bold tracking-widest flex items-center">
            <span class="mr-2 animate-pulse">●</span> 
            SYSTEM://HEALTH_STATUS
          </h2>
          <button (click)="close.emit()" class="text-green-500 hover:text-white hover:bg-green-700 px-2 py-1 rounded transition-colors text-sm uppercase font-bold">
            [X] Close
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          
          <!-- Top Status Section -->
          <div class="grid grid-cols-2 gap-4">
            <div class="border border-green-800 bg-black/50 p-4 rounded">
              <div class="text-xs text-green-600 uppercase mb-1">System Status</div>
              <div class="text-2xl font-bold" [ngClass]="{'text-green-400': health?.status === 'ok', 'text-red-500': health?.status === 'error'}">
                {{ health?.status === 'ok' ? 'ONLINE' : 'OFFLINE' }}
              </div>
            </div>
            <div class="border border-green-800 bg-black/50 p-4 rounded">
              <div class="text-xs text-green-600 uppercase mb-1">Service Uptime</div>
              <div class="text-2xl font-bold text-white">
                {{ formatUptime(health?.uptime || 0) }}
              </div>
            </div>
          </div>

          <!-- Modules Section -->
          <div>
            <div class="text-xs text-green-600 uppercase mb-2 border-b border-green-900/50 pb-1">>>> ACTIVE_MODULES</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Database Module -->
              <div class="bg-gray-800/50 p-3 rounded border-l-4" [ngClass]="health?.database?.status === 'connected' ? 'border-green-500' : 'border-red-500'">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-sm">DATABASE_LINK</span>
                  <span class="text-xs px-2 py-0.5 rounded" [ngClass]="health?.database?.status === 'connected' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'">
                    {{ health?.database?.status | uppercase }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 font-mono space-y-1">
                  <div class="flex justify-between"><span>HOST:</span> <span class="text-gray-300">{{ health?.database?.host }}</span></div>
                  <div class="flex justify-between"><span>NAME:</span> <span class="text-gray-300">{{ health?.database?.name }}</span></div>
                </div>
              </div>

              <!-- Backend Module -->
              <div class="bg-gray-800/50 p-3 rounded border-l-4 border-green-500">
                 <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-sm">CORE_SERVICE</span>
                  <span class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-300">ACTIVE</span>
                </div>
                <div class="text-xs text-gray-400 font-mono space-y-1">
                  <div class="flex justify-between"><span>NAME:</span> <span class="text-gray-300">{{ health?.service }}</span></div>
                  <div class="flex justify-between"><span>TS:</span> <span class="text-gray-300">{{ health?.timestamp | date:'HH:mm:ss' }}</span></div>
                </div>
              </div>

            </div>
          </div>

          <!-- Container Pool Section -->
          <div>
             <div class="text-xs text-green-600 uppercase mb-2 border-b border-green-900/50 pb-1">>>> EXECUTION_POOL</div>
             <div class="border border-green-500/30 bg-gray-900/80 p-4 rounded relative overflow-hidden group">
                <!-- Decorative background elements -->
                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-6xl">🐳</div>
                
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <div class="text-lg font-bold text-white">Container Pool</div>
                    <div class="text-xs text-green-500">{{ health?.containers?.image }}</div>
                  </div>
                  <div class="text-right flex space-x-6">
                     <div>
                        <div class="text-3xl font-bold">{{ health?.containers?.active }}</div>
                        <div class="text-xs text-green-400">ACTIVE</div>
                     </div>
                     <div>
                        <div class="text-3xl font-bold">{{ health?.containers?.available }} <span class="text-sm text-gray-500">/ {{ health?.containers?.poolSize }}</span></div>
                        <div class="text-xs text-gray-400">AVAILABLE</div>
                     </div>
                  </div>
                </div>

                <!-- Visual Bar -->
                <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                  <!-- Active part -->
                  <div class="bg-green-400 h-full transition-all duration-500" [style.width.%]="getActivePercentage()"></div>
                  <!-- Available part -->
                  <div class="bg-gray-600 h-full transition-all duration-500" [style.width.%]="getAvailablePercentage()"></div>
                </div>
             </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="bg-black/80 px-4 py-2 text-xs text-gray-600 uppercase flex justify-between border-t border-green-900">
           <span>SECURE_CONNECTION://ESTABLISHED</span>
           <span>ID: {{ generateSessionId() }}</span>
        </div>
      </div>
    </div>
    `
})
export class SystemHealthModalComponent {
    @Input() health: HealthStatus | undefined;
    @Output() close = new EventEmitter<void>();

    onBackdropClick(event: MouseEvent): void {
        this.close.emit();
    }

    formatUptime(seconds: number): string {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);

        return parts.join(' ');
    }

    getActivePercentage(): number {
        if (!this.health || !this.health.containers) return 0;
        const total = (this.health.containers.poolSize || 0) + (this.health.containers.active || 0);
        if (total === 0) return 0;
        return (this.health.containers.active / total) * 100;
    }

    getAvailablePercentage(): number {
        if (!this.health || !this.health.containers) return 0;
        const total = (this.health.containers.poolSize || 0) + (this.health.containers.active || 0);
        if (total === 0) return 0;
        return (this.health.containers.available / total) * 100;
    }

    generateSessionId(): string {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
}
