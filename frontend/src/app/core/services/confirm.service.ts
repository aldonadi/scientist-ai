import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmService {
    private dialogSubject = new BehaviorSubject<ConfirmDialogData | null>(null);
    private responseSubject = new Subject<boolean>();

    dialog$ = this.dialogSubject.asObservable();

    confirm(data: ConfirmDialogData): Promise<boolean> {
        this.dialogSubject.next({
            title: data.title,
            message: data.message,
            confirmText: data.confirmText || 'OK',
            cancelText: data.cancelText || 'Cancel'
        });

        return new Promise<boolean>((resolve) => {
            const subscription = this.responseSubject.subscribe((result) => {
                subscription.unsubscribe();
                resolve(result);
            });
        });
    }

    respond(result: boolean): void {
        this.dialogSubject.next(null);
        this.responseSubject.next(result);
    }
}
