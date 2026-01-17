import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'tools',
                loadComponent: () => import('./features/tools/tool-list.component').then(m => m.ToolListComponent)
            },
            {
                path: 'tools/new',
                loadComponent: () => import('./features/tools/tool-editor.component').then(m => m.ToolEditorComponent)
            },
            {
                path: 'tools/:id',
                loadComponent: () => import('./features/tools/tool-editor.component').then(m => m.ToolEditorComponent)
            },
            {
                path: 'plans',
                loadComponent: () => import('./features/plans/plan-list.component').then(m => m.PlanListComponent)
            },
            {
                path: 'plans/new',
                loadComponent: () => import('./features/plans/plan-editor/plan-editor.component').then(m => m.PlanEditorComponent),
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'plans/:id',
                loadComponent: () => import('./features/plans/plan-editor/plan-editor.component').then(m => m.PlanEditorComponent),
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'experiments',
                loadComponent: () => import('./features/experiments/experiment-list.component').then(m => m.ExperimentListComponent)
            },
            {
                path: 'experiments/:id',
                loadComponent: () => import('./features/experiments/experiment-monitor.component').then(m => m.ExperimentMonitorComponent)
            }
        ]
    }
];
