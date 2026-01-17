import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
    name: string;
    modelConfig: {
        provider: string;
        modelName: string;
        temperature?: number;
    };
    systemPrompt: string;
    tools: string[];
    variableWhitelist: string[];
}

export interface Goal {
    description: string;
    conditionScript: string;
}

export interface Script {
    hookType: string;
    code: string;
    failPolicy: 'ABORT_EXPERIMENT' | 'CONTINUE_WITH_ERROR';
    executionMode: 'SYNC' | 'ASYNC';
}

export interface ExperimentPlan {
    _id: string;
    name: string;
    description: string;
    initialEnvironment: { [key: string]: any };
    roles: Role[];
    goals: Goal[];
    scripts: Script[];
    maxSteps: number;
    createdAt: string;
    updatedAt?: string;
    roleCount?: number;
    goalCount?: number;
}

export interface CreatePlanDto {
    name: string;
    description: string;
    initialEnvironment?: { [key: string]: any };
    roles?: Role[];
    goals?: Goal[];
    scripts?: Script[];
    maxSteps?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private readonly apiUrl = '/api/plans';

    constructor(private http: HttpClient) { }

    getPlans(): Observable<ExperimentPlan[]> {
        return this.http.get<ExperimentPlan[]>(this.apiUrl);
    }

    getPlan(id: string): Observable<ExperimentPlan> {
        return this.http.get<ExperimentPlan>(`${this.apiUrl}/${id}`);
    }

    createPlan(plan: CreatePlanDto): Observable<ExperimentPlan> {
        return this.http.post<ExperimentPlan>(this.apiUrl, plan);
    }

    updatePlan(id: string, plan: Partial<CreatePlanDto>): Observable<ExperimentPlan> {
        return this.http.put<ExperimentPlan>(`${this.apiUrl}/${id}`, plan);
    }

    deletePlan(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    duplicatePlan(id: string, newName: string): Observable<ExperimentPlan> {
        return this.http.post<ExperimentPlan>(`${this.apiUrl}/${id}/duplicate`, { name: newName });
    }
}
