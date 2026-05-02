import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import type { PresetDto } from '../../core/models/job.models';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { PresetsApiService } from '../../core/services/presets-api.service';
import { RuntimeApiService } from '../../core/services/runtime-api.service';

@Component({
  standalone: true,
  selector: 'app-acquire-page',
  imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, InputTextModule, TooltipModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>{{ 'acquire.title' | translate }}</h1>
        <p class="muted">{{ 'acquire.subtitle' | translate }}</p>
      </div>

      <div class="modes">
        <button
          type="button"
          class="mode"
          [class.mode--on]="mode() === 'single'"
          (click)="mode.set('single')"
          [pTooltip]="'acquire.modeSingle' | translate"
          [attr.aria-label]="'acquire.modeSingle' | translate"
        >
          <i class="pi pi-link mode__ico" aria-hidden="true"></i>
          {{ 'acquire.modeSingle' | translate }}
        </button>
        <button
          type="button"
          class="mode"
          [class.mode--on]="mode() === 'batch'"
          (click)="mode.set('batch')"
          [pTooltip]="'acquire.modeBatch' | translate"
          [attr.aria-label]="'acquire.modeBatch' | translate"
        >
          <i class="pi pi-list mode__ico" aria-hidden="true"></i>
          {{ 'acquire.modeBatch' | translate }}
        </button>
      </div>

      <div class="dest card">
        <div class="dest__title">{{ 'acquire.destTitle' | translate }}</div>
        @if (downloadsError()) {
          <p class="dest__warn">{{ downloadsError() }}</p>
        } @else if (downloadsRoot()) {
          <p class="dest__path mono">{{ downloadsRoot() }}</p>
          <p class="muted dest__hint">{{ 'acquire.destHint' | translate }}</p>
        } @else {
          <p class="muted">{{ 'acquire.destLoading' | translate }}</p>
        }
      </div>

      <div class="row row--wrap">
        <label class="preset-label">
          {{ 'acquire.preset' | translate }}
          <select [(ngModel)]="presetId" class="preset-select">
            <option [ngValue]="null">{{ 'acquire.presetDefault' | translate }}</option>
            @for (p of presets(); track p.id) {
              <option [ngValue]="p.id">{{ p.name }}{{ p.isDefault ? ' ★' : '' }}</option>
            }
          </select>
        </label>
        @if (mode() === 'single') {
          <input pInputText type="url" placeholder="https://…" [(ngModel)]="url" class="grow" />
          <button
            pButton
            type="button"
            icon="pi pi-send"
            [label]="'acquire.enqueue' | translate"
            [pTooltip]="'acquire.enqueueTooltip' | translate"
            (click)="submitSingle()"
            [disabled]="busy() || !url"
          ></button>
        } @else {
          <div class="batch">
            <textarea
              [(ngModel)]="batchText"
              class="batch__area"
              rows="8"
              [placeholder]="'acquire.batchPlaceholder' | translate"
              [disabled]="busy()"
            ></textarea>
            <button
              pButton
              type="button"
              icon="pi pi-list-check"
              [label]="'acquire.enqueueBatch' | translate"
              [pTooltip]="'acquire.enqueueBatchTooltip' | translate"
              (click)="submitBatch()"
              [disabled]="busy() || !batchUrls().length"
            ></button>
          </div>
        }
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
      .modes {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .mode {
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.12));
        background: var(--md-surface-1, #1a1d24);
        color: var(--md-text-muted);
        cursor: pointer;
        font: inherit;
      }
      .mode--on {
        border-color: rgba(108, 140, 255, 0.45);
        color: var(--md-text);
        background: rgba(108, 140, 255, 0.1);
      }
      .mode__ico {
        margin-right: 8px;
        opacity: 0.85;
      }
      .row {
        margin-top: 16px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .row--wrap {
        flex-wrap: wrap;
      }
      .preset-label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--md-text-muted);
        min-width: 160px;
      }
      .preset-select {
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.12));
        background: var(--md-surface-1, #1a1d24);
        color: inherit;
      }
      .grow {
        flex: 1;
        min-width: 200px;
      }
      .batch {
        flex: 1;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .batch__area {
        width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.12));
        background: var(--md-surface-1, #1a1d24);
        color: inherit;
        font-family: ui-monospace, monospace;
        font-size: 0.85rem;
        resize: vertical;
      }
      .msg {
        margin-top: 12px;
        color: var(--md-text-muted);
        white-space: pre-wrap;
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
  private readonly presetsApi = inject(PresetsApiService);
  private readonly translate = inject(TranslateService);

  readonly mode = signal<'single' | 'batch'>('single');
  url = '';
  batchText = '';
  presetId: string | null = null;
  readonly presets = signal<PresetDto[]>([]);
  readonly busy = signal(false);
  readonly message = signal<string | undefined>(undefined);
  readonly downloadsRoot = signal<string | undefined>(undefined);
  readonly downloadsError = signal<string | undefined>(undefined);

  batchUrls(): string[] {
    return this.batchText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  async ngOnInit(): Promise<void> {
    try {
      const d = await this.runtimeApi.getDownloadsInfo();
      this.downloadsRoot.set(d.downloadsRoot);
    } catch {
      this.downloadsError.set(this.translate.instant('acquire.apiUnreachable'));
    }
    try {
      this.presets.set(await this.presetsApi.list());
    } catch {
      /* optional */
    }
  }

  private confirmDest(): boolean {
    const root = this.downloadsRoot();
    const hint = root ?? this.translate.instant('acquire.confirmDestFallback');
    return globalThis.confirm(this.translate.instant('acquire.confirmDest', { path: hint }));
  }

  async submitSingle(): Promise<void> {
    if (!this.confirmDest()) return;
    this.busy.set(true);
    this.message.set(undefined);
    try {
      const r = await this.jobsApi.createJob(this.url.trim(), 0, this.presetId);
      this.message.set(this.translate.instant('acquire.queuedOne', { id: r.id }));
      this.url = '';
    } catch (e) {
      this.message.set(e instanceof Error ? e.message : this.translate.instant('acquire.enqueueFailed'));
    } finally {
      this.busy.set(false);
    }
  }

  async submitBatch(): Promise<void> {
    const urls = this.batchUrls();
    if (!urls.length) return;
    if (!this.confirmDest()) return;
    this.busy.set(true);
    this.message.set(undefined);
    try {
      const r = await this.jobsApi.createBatchJobs(urls, 0, this.presetId);
      this.message.set(
        this.translate.instant('acquire.queuedMany', { count: r.ids.length, ids: r.ids.join('\n') }),
      );
      this.batchText = '';
    } catch (e) {
      this.message.set(
        e instanceof Error ? e.message : this.translate.instant('acquire.batchEnqueueFailed'),
      );
    } finally {
      this.busy.set(false);
    }
  }
}
