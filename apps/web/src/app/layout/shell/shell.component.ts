import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { interval } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { JobsRealtimeService } from '../../core/services/jobs-realtime.service';
import type { NotificationDto } from '../../core/services/notifications-api.service';
import { NotificationsApiService } from '../../core/services/notifications-api.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DialogModule,
    InputTextModule,
    ButtonModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  readonly realtime = inject(JobsRealtimeService);
  private readonly router = inject(Router);
  private readonly notificationsApi = inject(NotificationsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly paletteOpen = signal(false);
  readonly paletteQuery = signal('');
  readonly notifOpen = signal(false);
  readonly notifItems = signal<NotificationDto[]>([]);
  readonly notifUnread = signal(0);
  readonly notifLoading = signal(false);

  readonly nav = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Acquire', path: '/acquire' },
    { label: 'Queue', path: '/queue' },
    { label: 'History', path: '/history' },
    { label: 'Library', path: '/library' },
    { label: 'Presets', path: '/presets' },
    { label: 'Schedules', path: '/schedules' },
    { label: 'Cookies', path: '/cookies' },
    { label: 'Diagnostics', path: '/diagnostics' },
    { label: 'Settings', path: '/settings' },
  ] as const;

  readonly filteredNav = computed(() => {
    const q = this.paletteQuery().trim().toLowerCase();
    if (!q) return [...this.nav];
    return this.nav.filter(
      (n) => n.label.toLowerCase().includes(q) || n.path.replace('/', '').includes(q),
    );
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.realtime.start();
    } catch {
      // sidecar may be offline during web-only dev
    }

    void this.refreshNotifCount();
    interval(45_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.refreshNotifCount());

    globalThis.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        this.paletteOpen.update((v) => !v);
      }
    });
  }

  closePalette(): void {
    this.paletteOpen.set(false);
    this.paletteQuery.set('');
  }

  go(path: string): void {
    void this.router.navigateByUrl(path);
    this.closePalette();
  }

  async openNotifPanel(): Promise<void> {
    this.notifOpen.set(true);
    this.notifLoading.set(true);
    try {
      this.notifItems.set(await this.notificationsApi.list(80));
      this.notifUnread.set(await this.notificationsApi.unreadCount());
    } catch {
      this.notifItems.set([]);
    } finally {
      this.notifLoading.set(false);
    }
  }

  async refreshNotifCount(): Promise<void> {
    try {
      this.notifUnread.set(await this.notificationsApi.unreadCount());
    } catch {
      this.notifUnread.set(0);
    }
  }

  async openJobFromNotif(ev: Event, n: NotificationDto): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    if (!n.jobId) return;
    if (!n.readAt) await this.markNotifRead(n);
    this.closeNotifPanel();
    await this.router.navigate(['/jobs', n.jobId]);
  }

  async markNotifRead(n: NotificationDto): Promise<void> {
    if (n.readAt) return;
    try {
      await this.notificationsApi.markRead(n.id);
      this.notifItems.update((list) =>
        list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
      );
      await this.refreshNotifCount();
    } catch {
      /* ignore */
    }
  }

  async markAllNotifRead(): Promise<void> {
    try {
      await this.notificationsApi.markAllRead();
      await this.openNotifPanel();
      await this.refreshNotifCount();
    } catch {
      /* ignore */
    }
  }

  closeNotifPanel(): void {
    this.notifOpen.set(false);
    void this.refreshNotifCount();
  }
}
