import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SettingValue } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Subject, debounceTime } from 'rxjs';

interface GroupNode {
  name: string;
  path: string[];
  settings: SettingValue[];
  children: GroupNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <!-- Header -->
      <div class="settings-header">
        <h1>⚙️ Settings</h1>
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search settings..."
            class="search-input"
          />
          <button *ngIf="searchQuery" (click)="clearSearch()" class="clear-btn">✕</button>
        </div>
        <label class="advanced-toggle">
          <input type="checkbox" [(ngModel)]="showAdvanced" />
          Show Advanced
        </label>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">Loading settings...</div>

      <!-- Error State -->
      <div *ngIf="error" class="error-banner">{{ error }}</div>

      <!-- Main Content -->
      <div *ngIf="!loading" class="settings-content">
        
        <!-- Sidebar Navigation (default view) -->
        <div *ngIf="!isSearchActive" class="sidebar">
          <nav class="group-nav">
            <ng-container *ngFor="let group of groupTree">
              <div class="group-item" 
                   [class.selected]="selectedGroup === group.path.join('/')"
                   (click)="selectGroup(group)">
                <span class="group-icon">{{ group.expanded ? '▼' : '▶' }}</span>
                {{ group.name }}
              </div>
              <div *ngIf="group.expanded" class="group-children">
                <div *ngFor="let child of group.children"
                     class="group-item child"
                     [class.selected]="selectedGroup === child.path.join('/')"
                     (click)="selectGroup(child)">
                  {{ child.name }}
                </div>
              </div>
            </ng-container>
          </nav>
        </div>

        <!-- Settings Panel -->
        <div class="settings-panel" [class.full-width]="isSearchActive">
          <!-- Search Results Header -->
          <div *ngIf="isSearchActive" class="search-header">
            Showing {{ filteredSettings.length }} results for "{{ searchQuery }}"
          </div>

          <!-- Settings List -->
          <div class="settings-list">
            <div *ngFor="let setting of displayedSettings; trackBy: trackBySetting"
                 class="setting-row"
                 [class.error]="settingErrors[setting.key]"
                 [class.advanced]="setting.advanced">
              
              <!-- Setting Header -->
              <div class="setting-header">
                <div class="setting-info">
                  <span class="setting-name">{{ setting.name }}</span>
                  <span *ngIf="setting.advanced" class="advanced-badge">🔧</span>
                  <span *ngIf="!setting.isDefault" class="modified-badge">Modified</span>
                </div>
                <button *ngIf="!setting.isDefault" 
                        class="reset-btn" 
                        title="Reset to default"
                        (click)="resetSetting(setting)">↺</button>
              </div>

              <!-- Setting Description -->
              <div class="setting-description">{{ setting.description }}</div>

              <!-- Setting Tags (in search mode) -->
              <div *ngIf="isSearchActive" class="setting-breadcrumb">
                {{ setting.group.join(' > ') }}
              </div>

              <!-- Setting Editor -->
              <div class="setting-editor">
                <!-- String Input -->
                <input *ngIf="setting.type === 'string'" 
                       type="text"
                       [value]="setting.value"
                       (input)="onValueChange(setting, $event)"
                       class="input-string" />

                <!-- Integer Input -->
                <input *ngIf="setting.type === 'integer'" 
                       type="number"
                       [value]="setting.value"
                       [min]="setting.validation?.min"
                       [max]="setting.validation?.max"
                       step="1"
                       (input)="onValueChange(setting, $event)"
                       class="input-number" />

                <!-- Float Input -->
                <input *ngIf="setting.type === 'float'" 
                       type="number"
                       [value]="setting.value"
                       [min]="setting.validation?.min"
                       [max]="setting.validation?.max"
                       step="0.01"
                       (input)="onValueChange(setting, $event)"
                       class="input-number" />

                <!-- Boolean Toggle -->
                <label *ngIf="setting.type === 'boolean'" class="toggle-switch">
                  <input type="checkbox"
                         [checked]="setting.value"
                         (change)="onBooleanChange(setting, $event)" />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">{{ setting.value ? 'On' : 'Off' }}</span>
                </label>

                <!-- Enum Select -->
                <select *ngIf="setting.type === 'enum'"
                        [value]="setting.value"
                        (change)="onSelectChange(setting, $event)"
                        class="input-select">
                  <option *ngFor="let opt of setting.options" [value]="opt">{{ opt }}</option>
                </select>

                <!-- JSON Editor -->
                <textarea *ngIf="setting.type === 'json'"
                          [value]="stringifyJson(setting.value)"
                          (input)="onJsonChange(setting, $event)"
                          class="input-json"
                          rows="4"></textarea>
              </div>

              <!-- Validation Error -->
              <div *ngIf="settingErrors[setting.key]" class="validation-error">
                ⚠️ {{ settingErrors[setting.key] }}
              </div>

              <!-- Help Text -->
              <div *ngIf="setting.helpText" class="help-text">
                💡 {{ setting.helpText }}
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="displayedSettings.length === 0" class="empty-state">
              <p *ngIf="isSearchActive">No settings found matching "{{ searchQuery }}"</p>
              <p *ngIf="!isSearchActive">Select a group from the sidebar</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="settings-footer">
        <button class="btn-secondary" (click)="exportSettings()">📤 Export</button>
        <button class="btn-secondary" (click)="importSettings()">📥 Import</button>
        <button class="btn-danger" (click)="factoryReset()">🔄 Reset All</button>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f8fafc;
    }

    .settings-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .settings-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #1e293b;
    }

    .search-box {
      flex: 1;
      max-width: 400px;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 36px 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
    }

    .advanced-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #64748b;
    }

    .loading, .error-banner {
      padding: 24px;
      text-align: center;
    }

    .error-banner {
      background: #fef2f2;
      color: #dc2626;
    }

    .settings-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 240px;
      background: white;
      border-right: 1px solid #e2e8f0;
      overflow-y: auto;
    }

    .group-nav {
      padding: 8px 0;
    }

    .group-item {
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-size: 14px;
    }

    .group-item:hover {
      background: #f1f5f9;
    }

    .group-item.selected {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 500;
    }

    .group-item.child {
      padding-left: 40px;
    }

    .group-icon {
      font-size: 10px;
      width: 12px;
    }

    .settings-panel {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .settings-panel.full-width {
      padding: 16px 24px;
    }

    .search-header {
      margin-bottom: 16px;
      color: #64748b;
      font-size: 14px;
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-row {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      transition: border-color 0.2s;
    }

    .setting-row.error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .setting-row.advanced {
      border-left: 3px solid #8b5cf6;
    }

    .setting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .setting-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setting-name {
      font-weight: 600;
      color: #1e293b;
    }

    .advanced-badge {
      font-size: 12px;
    }

    .modified-badge {
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .reset-btn {
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      color: #64748b;
      font-size: 16px;
    }

    .reset-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .setting-description {
      color: #64748b;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .setting-breadcrumb {
      color: #94a3b8;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .setting-editor {
      margin-top: 8px;
    }

    .input-string, .input-number, .input-select {
      width: 100%;
      max-width: 400px;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
    }

    .input-json {
      width: 100%;
      max-width: 600px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      resize: vertical;
    }

    .toggle-switch {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .toggle-switch input {
      width: 40px;
      height: 22px;
      appearance: none;
      background: #cbd5e1;
      border-radius: 11px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-switch input:checked {
      background: #3b82f6;
    }

    .toggle-switch input::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: left 0.2s;
    }

    .toggle-switch input:checked::after {
      left: 20px;
    }

    .toggle-label {
      color: #64748b;
      font-size: 14px;
    }

    .validation-error {
      margin-top: 8px;
      color: #dc2626;
      font-size: 13px;
    }

    .help-text {
      margin-top: 8px;
      color: #64748b;
      font-size: 12px;
      font-style: italic;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #94a3b8;
    }

    .settings-footer {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary {
      padding: 8px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #f8fafc;
    }

    .btn-danger {
      padding: 8px 16px;
      background: white;
      border: 1px solid #fecaca;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #dc2626;
      margin-left: auto;
    }

    .btn-danger:hover {
      background: #fef2f2;
    }
  `]
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  settings: SettingValue[] = [];
  groupTree: GroupNode[] = [];
  selectedGroup = '';
  searchQuery = '';
  showAdvanced = false;
  loading = true;
  error = '';
  settingErrors: Record<string, string> = {};

  private searchSubject = new Subject<string>();
  private saveSubjects = new Map<string, Subject<any>>();

  constructor(
    private settingsService: SettingsService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) { }

  ngOnInit(): void {
    this.loadSettings();

    // Debounce search
    this.searchSubject.pipe(debounceTime(150)).subscribe(query => {
      this.searchQuery = query;
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.saveSubjects.forEach(s => s.complete());
  }

  get isSearchActive(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  get filteredSettings(): SettingValue[] {
    if (!this.isSearchActive) return this.settings;

    // Split query into keywords (whitespace-separated)
    const keywords = this.searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    return this.settings.filter(s => {
      // Build searchable text from all relevant fields
      const searchableText = [
        s.name,
        s.description,
        s.key,
        ...s.tags,
        ...s.group,
      ].join(' ').toLowerCase();

      // All keywords must be found in the searchable text
      const matchesSearch = keywords.every(keyword => searchableText.includes(keyword));

      const matchesAdvanced = this.showAdvanced || !s.advanced;
      return matchesSearch && matchesAdvanced;
    });
  }

  get displayedSettings(): SettingValue[] {
    if (this.isSearchActive) {
      return this.filteredSettings;
    }

    // Show settings for selected group
    if (this.selectedGroup) {
      return this.settings.filter(s => {
        const groupPath = s.group.join('/');
        const matchesGroup = groupPath === this.selectedGroup || groupPath.startsWith(this.selectedGroup + '/');
        const matchesAdvanced = this.showAdvanced || !s.advanced;
        return matchesGroup && matchesAdvanced;
      });
    }

    return [];
  }

  async loadSettings(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.settings = await this.settingsService.getAll();
      this.buildTree();

      // Select first group by default
      if (this.groupTree.length > 0) {
        const firstGroup = this.groupTree[0];
        firstGroup.expanded = true;
        if (firstGroup.children.length > 0) {
          this.selectedGroup = firstGroup.children[0].path.join('/');
        } else {
          this.selectedGroup = firstGroup.path.join('/');
        }
      }
    } catch (e: any) {
      this.error = e.message || 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  buildTree(): void {
    const tree = new Map<string, GroupNode>();

    for (const setting of this.settings) {
      const groupPath = setting.group;
      if (groupPath.length === 0) continue;

      // Create top-level group
      const topName = groupPath[0];
      if (!tree.has(topName)) {
        tree.set(topName, {
          name: topName,
          path: [topName],
          settings: [],
          children: [],
          expanded: false,
        });
      }
      const topNode = tree.get(topName)!;

      if (groupPath.length === 1) {
        topNode.settings.push(setting);
      } else {
        // Create child group
        const childName = groupPath[1];
        let childNode = topNode.children.find(c => c.name === childName);
        if (!childNode) {
          childNode = {
            name: childName,
            path: [topName, childName],
            settings: [],
            children: [],
            expanded: false,
          };
          topNode.children.push(childNode);
        }
        childNode.settings.push(setting);
      }
    }

    this.groupTree = Array.from(tree.values());
  }

  selectGroup(group: GroupNode): void {
    // Toggle expansion for top-level groups
    if (group.children.length > 0) {
      group.expanded = !group.expanded;
    }
    this.selectedGroup = group.path.join('/');
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  trackBySetting(index: number, setting: SettingValue): string {
    return setting.key;
  }

  async onValueChange(setting: SettingValue, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    let value: any = input.value;

    if (setting.type === 'integer') {
      value = parseInt(value, 10);
    } else if (setting.type === 'float') {
      value = parseFloat(value);
    }

    await this.saveSetting(setting, value);
  }

  async onBooleanChange(setting: SettingValue, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await this.saveSetting(setting, input.checked);
  }

  async onSelectChange(setting: SettingValue, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    await this.saveSetting(setting, select.value);
  }

  async onJsonChange(setting: SettingValue, event: Event): Promise<void> {
    const textarea = event.target as HTMLTextAreaElement;
    try {
      const value = JSON.parse(textarea.value);
      delete this.settingErrors[setting.key];
      await this.saveSetting(setting, value);
    } catch {
      this.settingErrors[setting.key] = 'Invalid JSON';
    }
  }

  private async saveSetting(setting: SettingValue, value: any): Promise<void> {
    // Get or create debounced save subject for this setting
    if (!this.saveSubjects.has(setting.key)) {
      const subject = new Subject<any>();
      this.saveSubjects.set(setting.key, subject);

      subject.pipe(debounceTime(500)).subscribe(async (val) => {
        const result = await this.settingsService.update(setting.key, val);
        if (!result.success) {
          this.settingErrors[setting.key] = result.errors?.[0]?.message || 'Validation failed';
        } else {
          delete this.settingErrors[setting.key];
          // Update local value
          const s = this.settings.find(x => x.key === setting.key);
          if (s) {
            s.value = val;
            s.isDefault = false;
          }
        }
      });
    }

    this.saveSubjects.get(setting.key)!.next(value);
  }

  async resetSetting(setting: SettingValue): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Reset Setting',
      message: `Reset "${setting.name}" to its default value?`
    });

    if (!confirmed) return;

    try {
      const result = await this.settingsService.reset(setting.key);
      setting.value = result.value;
      setting.isDefault = true;
      delete this.settingErrors[setting.key];
      this.toast.success(`Reset ${setting.name} to default`);
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async factoryReset(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: '⚠️ Factory Reset',
      message: 'This will reset ALL settings to their default values. Are you sure?',
      confirmText: 'Reset All'
    });

    if (!confirmed) return;

    try {
      const result = await this.settingsService.resetAll();
      this.toast.success(`Reset ${result.settingsReset} settings to defaults`);
      await this.loadSettings();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async exportSettings(): Promise<void> {
    try {
      const data = await this.settingsService.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.success('Settings exported');
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async importSettings(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await this.settingsService.import(data);

        if (result.imported > 0) {
          this.toast.success(`Imported ${result.imported} settings`);
          await this.loadSettings();
        }

        if (result.errors.length > 0) {
          this.toast.info(`${result.skipped} settings skipped`);
        }
      } catch (e: any) {
        this.toast.error(e.message || 'Failed to import settings');
      }
    };
    input.click();
  }

  stringifyJson(value: any): string {
    return JSON.stringify(value, null, 2);
  }
}
