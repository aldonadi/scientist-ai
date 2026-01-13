import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

    getLogs(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${id}/logs`);
    }

    deleteExperiment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
