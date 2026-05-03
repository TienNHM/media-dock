import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@app/layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('@app/features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'acquire',
        loadComponent: () => import('@app/features/acquire/acquire.page').then((m) => m.AcquirePage),
      },
      {
        path: 'jobs/:id',
        loadComponent: () => import('@app/features/jobs/job-detail.page').then((m) => m.JobDetailPage),
      },
      {
        path: 'queue',
        loadComponent: () => import('@app/features/queue/queue.page').then((m) => m.QueuePage),
      },
      {
        path: 'history',
        loadComponent: () => import('@app/features/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'library',
        loadComponent: () => import('@app/features/library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'presets',
        loadComponent: () => import('@app/features/presets/presets.page').then((m) => m.PresetsPage),
      },
      {
        path: 'schedules',
        loadComponent: () => import('@app/features/schedules/schedules.page').then((m) => m.SchedulesPage),
      },
      {
        path: 'cookies',
        loadComponent: () => import('@app/features/cookies/cookies.page').then((m) => m.CookiesPage),
      },
      {
        path: 'diagnostics',
        loadComponent: () => import('@app/features/diagnostics/diagnostics.page').then((m) => m.DiagnosticsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('@app/features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
];
