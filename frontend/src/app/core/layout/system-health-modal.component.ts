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
// ... (Component decorator unchanged)
<!--Container Pool Section-- >
    <div>
    <div class="text-xs text-green-600 uppercase mb-2 border-b border-green-900/50 pb-1" >>>> EXECUTION_POOL </div>
        < div class="border border-green-500/30 bg-gray-900/80 p-4 rounded relative overflow-hidden group" >
            <!--Decorative background elements-- >
                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-6xl" >🐳</div>

                    < div class="flex items-center justify-between mb-4" >
                        <div>
                        <div class="text-lg font-bold text-white" > Container Pool </div>
                            < div class="text-xs text-green-500" > {{ health?.containers?.image }}</div>
                                </div>
                                < div class="text-right flex space-x-6" >
                                    <div>
                                    <div class="text-3xl font-bold" > {{ health?.containers?.active }}</div>
                                        < div class="text-xs text-green-400" > ACTIVE </div>
                                            </div>
                                            < div >
                                            <div class="text-3xl font-bold" > {{ health?.containers?.available }} <span class="text-sm text-gray-500" > / {{ health?.containers?.poolSize }}</span > </div>
                                                < div class="text-xs text-gray-400" > AVAILABLE </div>
                                                    </div>
                                                    </div>
                                                    </div>

                                                    < !--Visual Bar-- >
                                                        <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex" >
                                                            <!--Active part-- >
                                                                <div class="bg-green-400 h-full transition-all duration-500"[style.width.%] = "getActivePercentage()" > </div>
                                                                    < !--Available part-- >
                                                                        <div class="bg-gray-600 h-full transition-all duration-500"[style.width.%] = "getAvailablePercentage()" > </div>
                                                                            </div>
                                                                            </div>
                                                                            </div>

                                                                            </div>

                                                                            < !--Footer -->
                                                                                <div class="bg-black/80 px-4 py-2 text-xs text-gray-600 uppercase flex justify-between border-t border-green-900" >
                                                                                    <span>SECURE_CONNECTION://ESTABLISHED</span>
<span>ID: { { generateSessionId() } } </span>
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
        if (d > 0) parts.push(`${ d } d`);
        if (h > 0) parts.push(`${ h } h`);
        if (m > 0 || parts.length === 0) parts.push(`${ m } m`);

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
