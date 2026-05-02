import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-settings-page',
  template: `
    <div class="page">
      <h1>Settings</h1>
      <p class="muted">Storage, concurrency, telemetry (Phase 2).</p>
    </div>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 6px;
      }
      .muted {
        color: var(--md-text-muted);
        margin: 0;
      }
    `,
  ],
})
export class SettingsPage {}
