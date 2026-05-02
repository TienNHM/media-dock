import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { RuntimeApiService } from '../../core/services/runtime-api.service';

@Component({
  standalone: true,
  selector: 'app-acquire-page',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Acquire</h1>
        <p class="muted">Quick capture from a single URL (batch + schedules land in Phase 2).</p>
      </div>

      <div class="dest card">
        <div class="dest__title">Nơi lưu file sau khi tải</div>
        @if (downloadsError()) {
          <p class="dest__warn">{{ downloadsError() }}</p>
        } @else if (downloadsRoot()) {
          <p class="dest__path mono">{{ downloadsRoot() }}</p>
          <p class="muted dest__hint">Mỗi job có một thư mục con (theo ID job). Đổi thư mục gốc trong Settings / cấu hình API.</p>
        } @else {
          <p class="muted">Đang tải thông tin…</p>
        }
      </div>

      <div class="row">
        <input pInputText type="url" placeholder="https://…" [(ngModel)]="url" class="grow" />
        <button pButton type="button" label="Enqueue" (click)="submit()" [disabled]="busy() || !url"></button>
      </div>

      @if (message()) {
        <p class="msg">{{ message() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .page__header h1 {
        margin: 0 0 6px;
      }
      .muted {
        color: var(--md-text-muted);
        margin: 0;
      }
      .row {
        margin-top: 16px;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .grow {
        flex: 1;
      }
      .msg {
        margin-top: 12px;
        color: var(--md-text-muted);
      }
      .card {
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.08));
        background: rgba(0, 0, 0, 0.15);
      }
      .dest__title {
        font-weight: 600;
        margin-bottom: 6px;
      }
      .dest__path {
        margin: 0;
        word-break: break-all;
        font-size: 0.9rem;
      }
      .dest__hint {
        margin: 8px 0 0;
        font-size: 0.85rem;
      }
      .dest__warn {
        margin: 0;
        color: var(--p-orange-400, #fb923c);
      }
      .mono {
        font-family: ui-monospace, monospace;
      }
    `,
  ],
})
export class AcquirePage implements OnInit {
  private readonly jobsApi = inject(JobsApiService);
  private readonly runtimeApi = inject(RuntimeApiService);

  url = '';
  readonly busy = signal(false);
  readonly message = signal<string | undefined>(undefined);
  readonly downloadsRoot = signal<string | undefined>(undefined);
  readonly downloadsError = signal<string | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    try {
      const d = await this.runtimeApi.getDownloadsInfo();
      this.downloadsRoot.set(d.downloadsRoot);
    } catch {
      this.downloadsError.set('Không lấy được cấu hình từ API (sidecar có đang chạy?).');
    }
  }

  async submit(): Promise<void> {
    const root = this.downloadsRoot();
    const hint =
      root ??
      '%LocalAppData%\\MediaDock\\downloads (mặc định nếu API không phản hồi)';
    const ok = globalThis.confirm(
      `File video sẽ được lưu dưới thư mục gốc:\n\n${hint}\n\nMỗi job một thư mục con. Tiếp tục enqueue?`,
    );
    if (!ok) return;

    this.busy.set(true);
    this.message.set(undefined);
    try {
      const r = await this.jobsApi.createJob(this.url.trim(), 0);
      this.message.set(`Queued job ${r.id}`);
      this.url = '';
    } catch (e) {
      this.message.set(e instanceof Error ? e.message : 'Failed to queue job');
    } finally {
      this.busy.set(false);
    }
  }
}
