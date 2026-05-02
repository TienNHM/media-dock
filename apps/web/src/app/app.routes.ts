import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'acquire',
        loadComponent: () => import('./features/acquire/acquire.page').then((m) => m.AcquirePage),
      },
      {
        path: 'jobs/:id',
        loadComponent: () => import('./features/jobs/job-detail.page').then((m) => m.JobDetailPage),
      },
      {
        path: 'queue',
        loadComponent: () => import('./features/queue/queue.page').then((m) => m.QueuePage),
      },
      {
        path: 'history',
        loadComponent: () => import('./features/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'library',
        loadComponent: () => import('./features/library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'presets',
        loadComponent: () => import('./features/presets/presets.page').then((m) => m.PresetsPage),
      },
      {
        path: 'schedules',
        loadComponent: () => import('./features/schedules/schedules.page').then((m) => m.SchedulesPage),
      },
      {
        path: 'cookies',
        loadComponent: () => import('./features/cookies/cookies.page').then((m) => m.CookiesPage),
      },
      {
        path: 'diagnostics',
        loadComponent: () => import('./features/diagnostics/diagnostics.page').then((m) => m.DiagnosticsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
];
