import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();

    show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
        const id = Math.random().toString(36).substring(2, 9);
        const toast: Toast = { id, message, type, duration };

        // Add to current list
        const current = this.toastsSubject.value;
        this.toastsSubject.next([...current, toast]);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    }

    success(message: string, duration: number = 3000): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration: number = 5000): void {
        this.show(message, 'error', duration);
    }

    info(message: string, duration: number = 3000): void {
        this.show(message, 'info', duration);
    }

    remove(id: string): void {
        const current = this.toastsSubject.value;
        this.toastsSubject.next(current.filter(t => t.id !== id));
    }
}
