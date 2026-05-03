import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '@app/core/config/api.config';
import { JobsRealtimeService } from '@app/core/services/jobs-realtime.service';
import { RuntimeApiService } from '@app/core/services/runtime-api.service';

@Component({
  standalone: true,
  selector: 'app-diagnostics-page',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="page">
      <h1>{{ 'diagnostics.title' | translate }}</h1>
      <p class="muted">{{ 'diagnostics.subtitle' | translate }}</p>

      <div class="box mono">
        <div class="box-hdr">
          <i class="pi pi-heart box-hdr__ico" aria-hidden="true"></i>
          <strong>{{ 'diagnostics.healthReady' | translate }}</strong>
        </div>
        <pre>{{ healthBody() }}</pre>
      </div>

      <div class="box mono">
        <div class="box-hdr">
          <i class="pi pi-folder-open box-hdr__ico" aria-hidden="true"></i>
          <strong>{{ 'diagnostics.runtimeDownloads' | translate }}</strong>
        </div>
        <pre>{{ downloadsBody() }}</pre>
      </div>

      <div class="box mono">
        <div class="box-hdr">
          <i class="pi pi-wifi box-hdr__ico" aria-hidden="true"></i>
          <strong>{{ 'diagnostics.lastProgress' | translate }}</strong>
        </div>
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
        border: 1px solid var(--md-border, rgba(255, 255, 255, 0.12));
        border-radius: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        overflow: auto;
        margin-bottom: 12px;
      }
      .box-hdr {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .box-hdr__ico {
        opacity: 0.8;
      }
      pre {
        margin: 8px 0 0;
        white-space: pre-wrap;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class DiagnosticsPage implements OnInit {
  readonly realtime = inject(JobsRealtimeService);
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly runtimeApi = inject(RuntimeApiService);
  private readonly translate = inject(TranslateService);

  readonly healthBody = signal<string>('');
  readonly downloadsBody = signal<string>('');

  async ngOnInit(): Promise<void> {
    const pending = this.translate.instant('common.loading');
    this.healthBody.set(pending);
    this.downloadsBody.set(pending);
    try {
      const h = await firstValueFrom(this.http.get<unknown>(`${this.base}/health/ready`));
      this.healthBody.set(JSON.stringify(h, null, 2));
    } catch (e) {
      this.healthBody.set(e instanceof Error ? e.message : this.translate.instant('common.requestFailed'));
    }
    try {
      const d = await this.runtimeApi.getDownloadsInfo();
      this.downloadsBody.set(JSON.stringify(d, null, 2));
    } catch (e) {
      this.downloadsBody.set(e instanceof Error ? e.message : this.translate.instant('common.requestFailed'));
    }
  }

  pretty(v: unknown): string {
    return JSON.stringify(v, null, 2);
  }
}
