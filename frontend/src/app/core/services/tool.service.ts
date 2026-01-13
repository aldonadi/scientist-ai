import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tool {
    _id: string;
    namespace: string;
    name: string;
    description: string;
    parameters: any;
    code: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateToolDto {
    namespace: string;
    name: string;
    description: string;
    parameters?: any;
    code: string;
}

@Injectable({
    providedIn: 'root'
})
export class ToolService {
    private readonly apiUrl = '/api/tools';

    constructor(private http: HttpClient) { }

    getTools(namespace?: string): Observable<Tool[]> {
        const options = namespace ? { params: { namespace } } : {};
        return this.http.get<Tool[]>(this.apiUrl, options);
    }

    getTool(id: string): Observable<Tool> {
        return this.http.get<Tool>(`${this.apiUrl}/${id}`);
    }

    createTool(tool: CreateToolDto): Observable<Tool> {
        return this.http.post<Tool>(this.apiUrl, tool);
    }

    updateTool(id: string, tool: Partial<CreateToolDto>): Observable<Tool> {
        return this.http.put<Tool>(`${this.apiUrl}/${id}`, tool);
    }

    deleteTool(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
