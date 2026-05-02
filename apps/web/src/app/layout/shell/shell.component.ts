import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { JobsRealtimeService } from '../../core/services/jobs-realtime.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DialogModule, InputTextModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  readonly realtime = inject(JobsRealtimeService);

  readonly paletteOpen = signal(false);
  readonly paletteQuery = signal('');

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

  async ngOnInit(): Promise<void> {
    try {
      await this.realtime.start();
    } catch {
      // sidecar may be offline during web-only dev
    }

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
}
