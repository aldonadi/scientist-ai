import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="confirmService.dialog$ | async as dialog" 
         class="fixed inset-0 z-[10000] flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" (click)="onCancel()"></div>
      
      <!-- Dialog -->
      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">{{ dialog.title }}</h3>
        </div>
        
        <!-- Body -->
        <div class="px-6 py-4">
          <p class="text-gray-600 whitespace-pre-line">{{ dialog.message }}</p>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button (click)="onCancel()"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium">
            {{ dialog.cancelText }}
          </button>
          <button (click)="onConfirm()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            {{ dialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
    constructor(public confirmService: ConfirmService) { }

    onConfirm(): void {
        this.confirmService.respond(true);
    }

    onCancel(): void {
        this.confirmService.respond(false);
    }
}
