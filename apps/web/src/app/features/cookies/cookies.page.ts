import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import type { CookieProfileDto } from '../../core/models/job.models';
import { CookiesApiService } from '../../core/services/cookies-api.service';

@Component({
  standalone: true,
  selector: 'app-cookies-page',
  imports: [CommonModule, FormsModule, TranslateModule, TableModule, ButtonModule, InputTextModule, TooltipModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>{{ 'cookies.title' | translate }}</h1>
        <div class="actions">
          <button
            pButton
            type="button"
            icon="pi pi-plus"
            class="p-button-text"
            [label]="'common.addRow' | translate"
            [pTooltip]="'cookies.addRowTooltip' | translate"
            (click)="addRow()"
          ></button>
          <button
            pButton
            type="button"
            icon="pi pi-file-check"
            [label]="'common.save' | translate"
            [pTooltip]="'cookies.saveAllTooltip' | translate"
            (click)="save()"
            [disabled]="busy()"
          ></button>
        </div>
      </div>
      <p class="muted">
        {{ 'cookies.subtitle' | translate: { key: ('cookies.cookiesPathKey' | translate) } }}
      </p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <p-table [value]="rows()" [tableStyle]="{ 'min-width': '52rem' }">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'common.name' | translate }}</th>
            <th>{{ 'common.filePath' | translate }}</th>
            <th scope="col" class="col-actions">
              <span class="sr-only">{{ 'cookies.removeRowHeader' | translate }}</span>
              <i
                class="pi pi-trash"
                aria-hidden="true"
                [pTooltip]="'cookies.removeRowTooltip' | translate"
                tooltipPosition="bottom"
              ></i>
            </th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row let-i="rowIndex">
          <tr>
            <td><input pInputText [(ngModel)]="row.name" class="w-full" /></td>
            <td><input pInputText [(ngModel)]="row.filePath" class="w-full mono" /></td>
            <td class="col-actions">
              <button
                pButton
                type="button"
                class="p-button-text p-button-rounded p-button-sm p-button-danger"
                icon="pi pi-trash"
                [pTooltip]="'cookies.removeRowTooltip' | translate"
                [attr.aria-label]="'cookies.removeRowTooltip' | translate"
                (click)="removeAt(i)"
              ></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .page__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .muted {
        color: var(--md-text-muted);
      }
      .err {
        color: #f87171;
      }
      .mono {
        font-family: ui-monospace, monospace;
        font-size: 0.85rem;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .col-actions {
        width: 3.5rem;
        text-align: center;
        vertical-align: middle;
      }
    `,
  ],
})
export class CookiesPage implements OnInit {
  private readonly api = inject(CookiesApiService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<{ id?: string; name: string; filePath: string; createdAt?: string }[]>([]);
  readonly error = signal<string | undefined>(undefined);
  readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(undefined);
    try {
      const list = await this.api.list();
      this.rows.set(list.map((c: CookieProfileDto) => ({ id: c.id, name: c.name, filePath: c.filePath, createdAt: c.createdAt })));
      if (this.rows().length === 0) this.rows.set([{ name: '', filePath: '' }]);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('cookies.loadFailed'));
      this.rows.set([{ name: '', filePath: '' }]);
    }
  }

  addRow(): void {
    this.rows.update((r) => [...r, { name: '', filePath: '' }]);
  }

  removeAt(i: number): void {
    this.rows.update((r) => r.filter((_, j) => j !== i));
    if (this.rows().length === 0) this.rows.set([{ name: '', filePath: '' }]);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const payload = this.rows()
        .filter((x) => x.name.trim() && x.filePath.trim())
        .map((x) => ({
          id: x.id ?? null,
          name: x.name.trim(),
          filePath: x.filePath.trim(),
          createdAt: x.createdAt ?? null,
        }));
      await this.api.save(payload);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('common.saveFailed'));
    } finally {
      this.busy.set(false);
    }
  }
}
