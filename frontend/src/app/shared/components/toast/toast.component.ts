import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div *ngFor="let toast of toastService.toasts$ | async"
           class="min-w-[300px] max-w-md p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 animate-slide-in relative overflow-hidden"
           [ngClass]="{
             'bg-green-600': toast.type === 'success',
             'bg-red-600': toast.type === 'error',
             'bg-blue-600': toast.type === 'info'
           }">
        <div class="flex justify-between items-start">
          <p class="mr-4 text-sm font-medium">{{ toast.message }}</p>
          <button (click)="toastService.remove(toast.id)" class="text-white hover:text-gray-200">
            ✕
          </button>
        </div>
        <!-- Progress bar for auto-dismiss -->
        <div *ngIf="toast.duration && toast.duration > 0" 
             class="absolute bottom-0 left-0 h-1 bg-white/30 animate-shrink"
             [style.animation-duration.ms]="toast.duration">
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out forwards;
    }
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-shrink {
      animation-name: shrink;
      animation-timing-function: linear;
    }
  `]
})
export class ToastComponent {
    constructor(public toastService: ToastService) { }
}
