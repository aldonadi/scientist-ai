import { Injectable } from '@angular/core';

export interface SettingValidation {
    required: boolean;
    min?: number;
    max?: number;
}

export interface SettingDefinition {
    key: string;
    name: string;
    description: string;
    type: 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'json';
    default: any;
    tags: string[];
    group: string[];
    scope: string;
    advanced: boolean;
    validation: SettingValidation;
    helpText?: string;
    options?: string[];  // For enum type
}

export interface SettingValue extends SettingDefinition {
    value: any;
    isDefault: boolean;
}

export interface ExportData {
    schemaVersion: number;
    exportedAt: string;
    settings: Record<string, any>;
}

export interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private baseUrl = '/api/settings';

    async getAll(): Promise<SettingValue[]> {
        const response = await fetch(this.baseUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        return response.json();
    }

    async getDefinitions(): Promise<SettingDefinition[]> {
        const response = await fetch(`${this.baseUrl}/definitions`);
        if (!response.ok) {
            throw new Error('Failed to fetch definitions');
        }
        return response.json();
    }

    async get(key: string): Promise<SettingValue> {
        const response = await fetch(`${this.baseUrl}/${key}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch setting: ${key}`);
        }
        return response.json();
    }

    async update(key: string, value: any): Promise<{ success: boolean; errors?: any[] }> {
        const response = await fetch(`${this.baseUrl}/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, errors: data.details || [{ message: data.message }] };
        }

        return { success: true };
    }

    async reset(key: string): Promise<{ value: any; wasReset: boolean }> {
        const response = await fetch(`${this.baseUrl}/${key}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to reset setting: ${key}`);
        }
        return response.json();
    }

    async resetAll(): Promise<{ settingsReset: number }> {
        const response = await fetch(`${this.baseUrl}/reset-all`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to reset all settings');
        }
        return response.json();
    }

    async export(): Promise<ExportData> {
        const response = await fetch(`${this.baseUrl}/export`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to export settings');
        }
        return response.json();
    }

    async import(data: ExportData): Promise<ImportResult> {
        const response = await fetch(`${this.baseUrl}/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    }

    /**
     * Build a grouped structure for sidebar navigation
     */
    buildGroupTree(settings: SettingValue[]): Map<string, SettingValue[]> {
        const groups = new Map<string, SettingValue[]>();

        for (const setting of settings) {
            const groupPath = setting.group.join(' > ');
            if (!groups.has(groupPath)) {
                groups.set(groupPath, []);
            }
            groups.get(groupPath)!.push(setting);
        }

        return groups;
    }
}
