import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: any[];
    thinking?: string;
    timestamp: string;
}

export interface Experiment {
    _id: string;
    planId: string;
    status: 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'STOPPED';
    currentStep: number;
    currentEnvironment: any;
    startTime: string;
    endTime?: string;
    result?: string;
    createdAt?: string;
    updatedAt?: string;
    roleHistory?: { [key: string]: ChatMessage[] };
}

export interface CreateExperimentDto {
    planId: string;
}

export interface ControlExperimentDto {
    command: 'pause' | 'resume' | 'stop';
}

@Injectable({
    providedIn: 'root'
})
export class ExperimentService {
    private readonly apiUrl = '/api/experiments';

    constructor(private http: HttpClient) { }

    getExperiments(): Observable<Experiment[]> {
        return this.http.get<Experiment[]>(this.apiUrl);
    }

    getExperiment(id: string): Observable<Experiment> {
        return this.http.get<Experiment>(`${this.apiUrl}/${id}`);
    }

    createExperiment(planId: string): Observable<Experiment> {
        return this.http.post<Experiment>(this.apiUrl, { planId });
    }

    controlExperiment(id: string, command: 'pause' | 'resume' | 'stop'): Observable<Experiment> {
        return this.http.post<Experiment>(`${this.apiUrl}/${id}/control`, { command });
    }

    getLogs(id: string, limit: number = 500): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/${id}/logs?limit=${limit}`).pipe(
            map(response => response.logs || [])
        );
    }

    deleteExperiment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getHistory(id: string): Observable<ExperimentStateHistory[]> {
        return this.http.get<ExperimentStateHistory[]>(`${this.apiUrl}/${id}/history`);
    }
}

export interface ExperimentStateHistory {
    _id: string;
    experimentId: string;
    stepNumber: number;
    timestamp: string;
    environment: any;
}
