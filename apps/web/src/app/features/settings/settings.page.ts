import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MEDIADOCK_SIDECAR_TOKEN_LS_KEY } from '@app/core/config/api.config';
import { LocaleService } from '@app/core/services/locale.service';
import { RuntimeApiService } from '@app/core/services/runtime-api.service';

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule, TooltipModule],
  template: `
    <div class="page">
      <h1>{{ 'settings.title' | translate }}</h1>
      <p class="muted">{{ 'settings.subtitle' | translate }}</p>

      <section class="block">
        <h2>{{ 'settings.sidecarSection' | translate }}</h2>
        <p class="hint">{{ 'settings.sidecarHint' | translate }}</p>
        <div class="form sidecar-token-form">
          <label class="lbl">{{ 'settings.sidecarLabel' | translate }}</label>
          <input
            pInputText
            type="password"
            class="inp"
            [placeholder]="'settings.sidecarPlaceholder' | translate"
            [(ngModel)]="editSidecarToken"
            autocomplete="new-password"
            spellcheck="false"
          />
          <div class="btns">
            <button
              pButton
              type="button"
              icon="pi pi-save"
              [label]="'settings.sidecarSave' | translate"
              (click)="saveSidecarBrowserToken()"
            ></button>
            <button
              pButton
              type="button"
              class="p-button-secondary"
              icon="pi pi-times"
              [label]="'settings.sidecarClear' | translate"
              (click)="clearSidecarBrowserToken()"
            ></button>
          </div>
          @if (sidecarTokenMsg()) {
            <p class="msg">{{ sidecarTokenMsg() }}</p>
          }
        </div>
      </section>

      <section class="block">
        <h2>{{ 'settings.language' | translate }}</h2>
        <div class="form lang-row">
          <select
            class="lang-select"
            [ngModel]="locale.lang()"
            (ngModelChange)="locale.use($event)"
          >
            <option [ngValue]="'en'">{{ 'settings.langEn' | translate }}</option>
            <option [ngValue]="'vi'">{{ 'settings.langVi' | translate }}</option>
          </select>
        </div>
      </section>

      <section class="block">
        <h2>{{ 'settings.downloadsSection' | translate }}</h2>
        @if (downloadsError()) {
          <p class="warn">{{ downloadsError() }}</p>
        } @else if (loaded()) {
          <p class="mono path resolved">
            <strong>{{ 'settings.inUse' | translate }}</strong> {{ downloadsRoot() }}
          </p>
          <p class="muted meta">
            {{ 'settings.currentSource' | translate }} <code>{{ source() }}</code>
            @if (configuredPath()) {
              · {{ 'settings.metaConfigFile' | translate }} <span class="mono">{{ configuredPath() }}</span>
            }
            @if (databasePath()) {
              · {{ 'settings.metaDbOverride' | translate }} <span class="mono">{{ databasePath() }}</span>
            }
          </p>

          <div class="form">
            <label class="lbl">{{ 'settings.dbOverrideLabel' | translate }}</label>
            <input
              pInputText
              type="text"
              class="inp"
              [placeholder]="'settings.dbOverridePlaceholder' | translate"
              [(ngModel)]="editPath"
              [disabled]="saveBusy()"
            />
            <div class="btns">
              <button
                pButton
                type="button"
                icon="pi pi-file-check"
                [label]="'settings.saveOverride' | translate"
                [pTooltip]="'settings.saveOverrideTooltip' | translate"
                (click)="savePath()"
                [disabled]="saveBusy()"
              ></button>
              <button
                pButton
                type="button"
                class="p-button-secondary"
                icon="pi pi-trash"
                [label]="'settings.clearDbOverride' | translate"
                [pTooltip]="'settings.clearDbOverrideTooltip' | translate"
                (click)="clearDbOverride()"
                [disabled]="saveBusy()"
              ></button>
            </div>
          </div>

          <p class="hint">
            {{ 'settings.hintOrder' | translate: { configKey: ('settings.configKey' | translate) } }}
          </p>
          @if (saveMessage()) {
            <p class="msg">{{ saveMessage() }}</p>
          }
        } @else {
          <p class="muted">{{ 'settings.loading' | translate }}</p>
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
      .lang-row {
        max-width: 16rem;
      }
      .lang-select {
        width: 100%;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.12));
        background: var(--md-surface-1, #1a1d24);
        color: inherit;
        font: inherit;
      }
      .sidecar-token-form {
        margin-top: 12px;
      }
    `,
  ],
})
export class SettingsPage implements OnInit {
  private readonly runtimeApi = inject(RuntimeApiService);
  private readonly translate = inject(TranslateService);
  readonly locale = inject(LocaleService);

  readonly downloadsRoot = signal<string | undefined>(undefined);
  readonly configuredPath = signal<string | null | undefined>(undefined);
  readonly databasePath = signal<string | null | undefined>(undefined);
  readonly source = signal<string>('');
  readonly downloadsError = signal<string | undefined>(undefined);
  readonly loaded = signal(false);
  readonly saveBusy = signal(false);
  readonly saveMessage = signal<string | undefined>(undefined);
  readonly sidecarTokenMsg = signal<string | undefined>(undefined);

  editPath = '';
  editSidecarToken = '';

  async ngOnInit(): Promise<void> {
    try {
      this.editSidecarToken = localStorage.getItem(MEDIADOCK_SIDECAR_TOKEN_LS_KEY) ?? '';
    } catch {
      this.editSidecarToken = '';
    }
    await this.reload();
  }

  saveSidecarBrowserToken(): void {
    this.sidecarTokenMsg.set(undefined);
    try {
      const t = this.editSidecarToken.trim();
      if (t.length === 0) {
        localStorage.removeItem(MEDIADOCK_SIDECAR_TOKEN_LS_KEY);
      } else {
        localStorage.setItem(MEDIADOCK_SIDECAR_TOKEN_LS_KEY, t);
      }
      this.sidecarTokenMsg.set(this.translate.instant('settings.sidecarSaved'));
    } catch (e) {
      this.sidecarTokenMsg.set(
        e instanceof Error ? e.message : this.translate.instant('settings.sidecarSaveFailed'),
      );
    }
  }

  clearSidecarBrowserToken(): void {
    this.sidecarTokenMsg.set(undefined);
    try {
      localStorage.removeItem(MEDIADOCK_SIDECAR_TOKEN_LS_KEY);
      this.editSidecarToken = '';
      this.sidecarTokenMsg.set(this.translate.instant('settings.sidecarCleared'));
    } catch (e) {
      this.sidecarTokenMsg.set(
        e instanceof Error ? e.message : this.translate.instant('settings.sidecarSaveFailed'),
      );
    }
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
      this.downloadsError.set(this.translate.instant('settings.apiUnreachable'));
      this.loaded.set(true);
    }
  }

  async savePath(): Promise<void> {
    this.saveBusy.set(true);
    this.saveMessage.set(undefined);
    try {
      const v = this.editPath.trim();
      await this.runtimeApi.setDownloadsPath(v.length ? v : null);
      this.saveMessage.set(this.translate.instant('settings.saved'));
      await this.reload();
    } catch (e) {
      this.saveMessage.set(e instanceof Error ? e.message : this.translate.instant('common.saveFailed'));
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
      this.saveMessage.set(this.translate.instant('settings.cleared'));
      await this.reload();
    } catch (e) {
      this.saveMessage.set(e instanceof Error ? e.message : this.translate.instant('common.saveFailed'));
    } finally {
      this.saveBusy.set(false);
    }
  }
}
