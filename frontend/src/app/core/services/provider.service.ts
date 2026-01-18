import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProviderService {
    private readonly apiUrl = '/api/providers';

    constructor(private http: HttpClient) { }

    getModels(id: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/${id}/models`);
    }

    testModel(id: string, model: string): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/test`, { model });
    }
}
