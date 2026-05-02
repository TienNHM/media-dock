import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RuntimeApiService } from '../../core/services/runtime-api.service';

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>Settings</h1>
      <p class="muted">Một phần tùy chọn vẫn cấu hình qua API (appsettings / biến môi trường).</p>

      <section class="block">
        <h2>Thư mục tải xuống</h2>
        @if (downloadsError()) {
          <p class="warn">{{ downloadsError() }}</p>
        } @else if (downloadsRoot()) {
          <p class="mono path">{{ downloadsRoot() }}</p>
          @if (configuredPath()) {
            <p class="muted">Đã set tường minh: <span class="mono">{{ configuredPath() }}</span></p>
          } @else {
            <p class="muted">Đang dùng mặc định: %LocalAppData%\MediaDock\downloads</p>
          }
          <p class="hint">
            Đổi bằng cấu hình <code>Acquisition:DownloadsRootPath</code> hoặc biến môi trường
            <code>Acquisition__DownloadsRootPath</code>, rồi khởi động lại API.
          </p>
        } @else {
          <p class="muted">Đang tải…</p>
        }
      </section>
    </div>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 6px;
      }
      h2 {
        margin: 20px 0 8px;
        font-size: 1.05rem;
      }
      .muted {
        color: var(--md-text-muted);
        margin: 0 0 12px;
      }
      .block {
        margin-top: 8px;
      }
      .path {
        margin: 0 0 8px;
        word-break: break-all;
      }
      .mono {
        font-family: ui-monospace, monospace;
      }
      .hint {
        font-size: 0.9rem;
        color: var(--md-text-muted);
        margin: 12px 0 0;
        max-width: 52rem;
      }
      .hint code {
        font-size: 0.85em;
      }
      .warn {
        color: var(--p-orange-400, #fb923c);
      }
    `,
  ],
})
export class SettingsPage implements OnInit {
  private readonly runtimeApi = inject(RuntimeApiService);

  readonly downloadsRoot = signal<string | undefined>(undefined);
  readonly configuredPath = signal<string | null | undefined>(undefined);
  readonly downloadsError = signal<string | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    try {
      const d = await this.runtimeApi.getDownloadsInfo();
      this.downloadsRoot.set(d.downloadsRoot);
      this.configuredPath.set(d.configuredRootPath);
    } catch {
      this.downloadsError.set('Không kết nối được API để đọc đường dẫn lưu.');
    }
  }
}
