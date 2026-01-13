import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-experiment-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Experiments</h1>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p class="text-gray-500 mb-4">Experiment monitoring UI coming soon.</p>
        <a routerLink="/plans" class="text-blue-600 hover:text-blue-800">
          Go to Plans to launch an experiment
        </a>
      </div>
    </div>
  `
})
export class ExperimentListComponent implements OnInit {
    ngOnInit(): void {
        // TODO: Load experiments
    }
}
