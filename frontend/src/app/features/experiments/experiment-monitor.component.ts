import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-experiment-monitor',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <button (click)="goBack()" class="mr-4 text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 class="text-2xl font-bold text-gray-900">Experiment Monitor</h1>
        </div>
        <div class="flex items-center space-x-3">
          <button class="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors">
            Pause
          </button>
          <button class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
            Stop
          </button>
        </div>
      </div>
      
      <div class="flex-1 grid grid-cols-3 gap-6">
        <!-- Live Log Feed -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-auto">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Live Log Feed</h2>
          <div class="space-y-2 font-mono text-xs text-gray-600">
            <p>[INFO] Experiment started...</p>
            <p>[INFO] Step 1 beginning...</p>
            <p class="text-blue-600">[ROLE] StockPicker thinking...</p>
          </div>
        </div>
        
        <!-- Role Activity -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-auto">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Role Activity</h2>
          <p class="text-gray-500 text-sm">Monitoring coming soon...</p>
        </div>
        
        <!-- Environment Inspector -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-auto">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Environment</h2>
          <pre class="text-xs font-mono text-gray-600">{{ '{ "money": 5000 }' }}</pre>
        </div>
      </div>
    </div>
  `
})
export class ExperimentMonitorComponent implements OnInit {
    @Input() id?: string;

    constructor(private router: Router, private route: ActivatedRoute) { }

    ngOnInit(): void {
        const routeId = this.route.snapshot.paramMap.get('id');
        if (routeId) {
            this.id = routeId;
            // TODO: Load experiment and connect to SSE stream
        }
    }

    goBack(): void {
        this.router.navigate(['/experiments']);
    }
}
