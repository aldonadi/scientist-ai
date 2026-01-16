import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LogEntry {
    _id: string;
    experimentId: string;
    stepNumber: number;
    timestamp: string;
    source: string;
    message: string;
    data?: any;
}

@Component({
    selector: 'app-log-feed',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div #logContainer class="h-full overflow-auto font-mono text-xs" (scroll)="onScroll()">
      <div *ngIf="logs.length === 0" class="text-gray-400 p-4 text-center">
        No logs yet...
      </div>
      
      <div *ngFor="let log of logs" 
           class="px-3 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
           [ngClass]="getLogClass(log)">
        <div class="flex items-start gap-3">
          <span class="text-gray-400 shrink-0 w-20">{{ formatTime(log.timestamp) }}</span>
          <span class="shrink-0 w-16 font-semibold" [ngClass]="getSourceClass(log.source)">
            [{{ log.source | uppercase }}]
          </span>
          <span class="flex-1 break-words">{{ log.message }}</span>
        </div>
        <div *ngIf="log.data" class="mt-1 ml-36 text-gray-500 text-[10px] bg-gray-50 p-2 rounded">
          {{ formatData(log.data) }}
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class LogFeedComponent implements OnChanges, AfterViewChecked {
    @Input() logs: LogEntry[] = [];
    @ViewChild('logContainer') logContainer!: ElementRef<HTMLDivElement>;

    private shouldAutoScroll = true;
    private previousLogCount = 0;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['logs'] && this.logs.length > this.previousLogCount) {
            // New logs added, enable auto-scroll
            this.shouldAutoScroll = true;
        }
        this.previousLogCount = this.logs.length;
    }

    ngAfterViewChecked(): void {
        if (this.shouldAutoScroll && this.logContainer) {
            this.scrollToBottom();
        }
    }

    onScroll(): void {
        if (!this.logContainer) return;
        const el = this.logContainer.nativeElement;
        // Disable auto-scroll if user scrolled up
        const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
        this.shouldAutoScroll = isAtBottom;
    }

    private scrollToBottom(): void {
        const el = this.logContainer?.nativeElement;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }

    getLogClass(log: LogEntry): string {
        if (log.source.toLowerCase().includes('error')) {
            return 'bg-red-50';
        }
        return '';
    }

    getSourceClass(source: string): string {
        const lower = source.toLowerCase();
        if (lower === 'system' || lower === 'orchestrator') {
            return 'text-gray-600';
        }
        if (lower.includes('role') || lower.includes('agent')) {
            return 'text-blue-600';
        }
        if (lower.includes('tool')) {
            return 'text-green-600';
        }
        if (lower.includes('error')) {
            return 'text-red-600';
        }
        if (lower.includes('hook') || lower.includes('script')) {
            return 'text-purple-600';
        }
        return 'text-gray-600';
    }

    formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    formatData(data: any): string {
        try {
            return JSON.stringify(data, null, 2).substring(0, 200);
        } catch {
            return String(data);
        }
    }
}
