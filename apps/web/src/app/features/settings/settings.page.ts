import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RuntimeApiService } from '../../core/services/runtime-api.service';

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="page">
      <h1>Settings</h1>
      <p class="muted">Một phần tùy chọn vẫn cấu hình qua API (appsettings / biến môi trường).</p>

      <section class="block">
        <h2>Thư mục tải xuống</h2>
        @if (downloadsError()) {
          <p class="warn">{{ downloadsError() }}</p>
        } @else if (loaded()) {
          <p class="mono path resolved"><strong>Đang dùng:</strong> {{ downloadsRoot() }}</p>
          <p class="muted meta">
            Nguồn hiện tại: <code>{{ source() }}</code>
            @if (configuredPath()) {
              · Cấu hình file: <span class="mono">{{ configuredPath() }}</span>
            }
            @if (databasePath()) {
              · Ghi đè DB: <span class="mono">{{ databasePath() }}</span>
            }
          </p>

          <div class="form">
            <label class="lbl">Ghi đè qua cơ sở dữ liệu (ưu tiên sau cấu hình file)</label>
            <input
              pInputText
              type="text"
              class="inp"
              placeholder="Để trống = xóa ghi đè, dùng mặc định / config"
              [(ngModel)]="editPath"
              [disabled]="saveBusy()"
            />
            <div class="btns">
              <button
                pButton
                type="button"
                label="Lưu ghi đè"
                (click)="savePath()"
                [disabled]="saveBusy()"
              ></button>
              <button
                pButton
                type="button"
                class="p-button-secondary"
                label="Xóa ghi đè DB"
                (click)="clearDbOverride()"
                [disabled]="saveBusy()"
              ></button>
            </div>
          </div>

          <p class="hint">
            Thứ tự áp dụng: <code>Acquisition:DownloadsRootPath</code> (config) → ghi đè trong DB → mặc định
            %LocalAppData%\MediaDock\downloads. Đổi config cần khởi động lại API.
          </p>
          @if (saveMessage()) {
            <p class="msg">{{ saveMessage() }}</p>
          }
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
      .meta {
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .block {
        margin-top: 8px;
      }
      .path {
        margin: 0 0 8px;
        word-break: break-all;
      }
      .resolved {
        font-size: 0.95rem;
      }
      .mono {
        font-family: ui-monospace, monospace;
      }
      .hint {
        font-size: 0.9rem;
        color: var(--md-text-muted);
        margin: 16px 0 0;
        max-width: 52rem;
      }
      .hint code {
        font-size: 0.85em;
      }
      .warn {
        color: var(--p-orange-400, #fb923c);
      }
      .form {
        margin-top: 16px;
        display: grid;
        gap: 10px;
        max-width: 40rem;
      }
      .lbl {
        font-size: 0.85rem;
        color: var(--md-text-muted);
      }
      .inp {
        width: 100%;
      }
      .btns {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .msg {
        margin-top: 12px;
        color: var(--md-text-muted);
      }
    `,
  ],
})
export class SettingsPage implements OnInit {
  private readonly runtimeApi = inject(RuntimeApiService);

  readonly downloadsRoot = signal<string | undefined>(undefined);
  readonly configuredPath = signal<string | null | undefined>(undefined);
  readonly databasePath = signal<string | null | undefined>(undefined);
  readonly source = signal<string>('');
  readonly downloadsError = signal<string | undefined>(undefined);
  readonly loaded = signal(false);
  readonly saveBusy = signal(false);
  readonly saveMessage = signal<string | undefined>(undefined);

  editPath = '';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    try {
      const d = await this.runtimeApi.getDownloadsInfo();
      this.downloadsRoot.set(d.downloadsRoot);
      this.configuredPath.set(d.configuredRootPath);
      this.databasePath.set(d.databaseRootPath);
      this.source.set(d.source);
      this.editPath = d.databaseRootPath ?? '';
      this.loaded.set(true);
    } catch {
      this.downloadsError.set('Không kết nối được API để đọc đường dẫn lưu.');
      this.loaded.set(true);
    }
  }

  async savePath(): Promise<void> {
    this.saveBusy.set(true);
    this.saveMessage.set(undefined);
    try {
      const v = this.editPath.trim();
      await this.runtimeApi.setDownloadsPath(v.length ? v : null);
      this.saveMessage.set('Đã lưu.');
      await this.reload();
    } catch (e) {
      this.saveMessage.set(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      this.saveBusy.set(false);
    }
  }

  async clearDbOverride(): Promise<void> {
    this.saveBusy.set(true);
    this.saveMessage.set(undefined);
    try {
      await this.runtimeApi.setDownloadsPath(null);
      this.editPath = '';
      this.saveMessage.set('Đã xóa ghi đè trong DB.');
      await this.reload();
    } catch (e) {
      this.saveMessage.set(e instanceof Error ? e.message : 'Thao tác thất bại');
    } finally {
      this.saveBusy.set(false);
    }
  }
}
