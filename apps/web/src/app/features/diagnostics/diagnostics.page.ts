import { Component, inject } from '@angular/core';
import { JobsRealtimeService } from '../../core/services/jobs-realtime.service';

@Component({
  standalone: true,
  selector: 'app-diagnostics-page',
  template: `
    <div class="page">
      <h1>Diagnostics</h1>
      <p class="muted">Live telemetry + support bundle (Phase 2).</p>

      <div class="box mono">
        <div><strong>Last job progress</strong></div>
        <pre>{{ pretty(realtime.lastProgress()) }}</pre>
      </div>
    </div>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 6px;
      }
      .muted {
        color: var(--md-text-muted);
        margin: 0 0 12px;
      }
      .box {
        border: 1px solid var(--md-border);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        overflow: auto;
      }
      pre {
        margin: 8px 0 0;
        white-space: pre-wrap;
      }
    `,
  ],
})
export class DiagnosticsPage {
  readonly realtime = inject(JobsRealtimeService);

  pretty(v: unknown): string {
    return JSON.stringify(v, null, 2);
  }
}
