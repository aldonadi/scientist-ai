import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperimentService, Experiment } from '../../core/services/experiment.service';

@Component({
  selector: 'app-experiment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Experiments</h1>
      </div>
      
      <div *ngIf="experiments.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p class="text-gray-500 mb-4">No experiments found.</p>
        <a routerLink="/plans" class="text-blue-600 hover:text-blue-800">
          Go to Plans to launch an experiment
        </a>
      </div>

      <div *ngIf="experiments.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
            <tr *ngFor="let experiment of experiments">
              <td class="px-6 py-4 whitespace-nowrap">
                <span [ngClass]="{
                  'bg-yellow-100 text-yellow-800': experiment.status === 'INITIALIZING',
                  'bg-blue-100 text-blue-800': experiment.status === 'RUNNING',
                  'bg-green-100 text-green-800': experiment.status === 'COMPLETED',
                  'bg-red-100 text-red-800': experiment.status === 'FAILED',
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
export class ExperimentListComponent implements OnInit {
  experiments: Experiment[] = [];

  constructor(private experimentService: ExperimentService) { }

  ngOnInit(): void {
    this.loadExperiments();
  }

  loadExperiments(): void {
    this.experimentService.getExperiments().subscribe({
      next: (experiments) => {
        this.experiments = experiments;
      },
      error: (error) => {
        console.error('Error loading experiments', error);
      }
    });
  }
}
