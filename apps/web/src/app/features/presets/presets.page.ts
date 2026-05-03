import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import type { PresetDto } from '@app/core/models/job.models';
import { PresetsApiService } from '@app/core/services/presets-api.service';

@Component({
  standalone: true,
  selector: 'app-presets-page',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    Textarea,
    TooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>{{ 'presets.title' | translate }}</h1>
        <button
          pButton
          type="button"
          icon="pi pi-plus"
          [label]="'common.newPreset' | translate"
          [pTooltip]="'presets.createTooltip' | translate"
          (click)="openCreate()"
        ></button>
      </div>
      <p class="muted">{{ 'presets.subtitle' | translate }}</p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <p-table [value]="presets()" [tableStyle]="{ 'min-width': '48rem' }">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'common.name' | translate }}</th>
            <th [pTooltip]="'presets.defaultStarHint' | translate" tooltipPosition="bottom">
              {{ 'common.default' | translate }}
            </th>
            <th>{{ 'common.updated' | translate }}</th>
            <th scope="col" class="col-actions">
              <span class="sr-only">{{ 'common.actions' | translate }}</span>
              <i
                class="pi pi-bolt"
                aria-hidden="true"
                [pTooltip]="'common.actions' | translate"
                tooltipPosition="bottom"
              ></i>
            </th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td>{{ p.name }}</td>
            <td>
              @if (p.isDefault) {
                <span class="default-flag" aria-hidden="true">★ </span>
              }
              {{ p.isDefault ? ('common.yes' | translate) : ('common.no' | translate) }}
            </td>
            <td class="mono">{{ p.updatedAt | date: 'short' }}</td>
            <td class="actions">
              <button
                pButton
                type="button"
                class="p-button-text p-button-rounded p-button-sm"
                icon="pi pi-pencil"
                [pTooltip]="'common.edit' | translate"
                [attr.aria-label]="'presets.editAria' | translate: { name: p.name }"
                (click)="openEdit(p)"
              ></button>
              <button
                pButton
                type="button"
                class="p-button-text p-button-rounded p-button-sm p-button-danger"
                icon="pi pi-trash"
                [pTooltip]="'common.delete' | translate"
                [attr.aria-label]="'presets.deleteAria' | translate: { name: p.name }"
                (click)="remove(p)"
              ></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4">
              <span class="muted emptymessage">{{ 'presets.emptyTable' | translate }}</span>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [header]="(editingId() ? 'presets.editPreset' : 'presets.newPreset') | translate"
      [visible]="dialogOpen()"
      (visibleChange)="dialogOpen.set($event)"
      [modal]="true"
      [style]="{ width: 'min(640px, 94vw)' }"
    >
      <div class="form">
        <label>{{ 'common.name' | translate }}</label>
        <input
          pInputText
          [(ngModel)]="formName"
          class="w-full"
          [placeholder]="'presets.namePlaceholder' | translate"
        />
        <label>{{ 'presets.description' | translate }}</label>
        <input
          pInputText
          [(ngModel)]="formDescription"
          class="w-full"
          [placeholder]="'presets.descriptionPlaceholder' | translate"
        />
        <label>{{ 'presets.specJson' | translate }}</label>
        <textarea pTextarea [(ngModel)]="formSpec" rows="8" class="w-full mono"></textarea>
        <label class="row-check"
          ><input type="checkbox" [(ngModel)]="formDefault" /> {{ 'presets.defaultPreset' | translate }}</label
        >
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          icon="pi pi-times"
          class="p-button-text p-button-rounded"
          [attr.aria-label]="'common.cancel' | translate"
          [pTooltip]="'common.cancel' | translate"
          (click)="dialogOpen.set(false)"
        ></button>
        <button
          pButton
          type="button"
          icon="pi pi-check"
          [label]="'common.save' | translate"
          [attr.aria-label]="'presets.savePreset' | translate"
          (click)="save()"
          [disabled]="busy() || !formName.trim()"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .page__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      h1 {
        margin: 0;
      }
      .muted {
        color: var(--md-text-muted);
      }
      .err {
        color: #f87171;
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
        width: 4.5rem;
        text-align: center;
        vertical-align: middle;
      }
      .actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        white-space: nowrap;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .form label {
        font-size: 0.85rem;
        margin-top: 4px;
      }
      .row-check {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mono {
        font-family: ui-monospace, monospace;
        font-size: 0.85rem;
      }
      .default-flag {
        opacity: 0.85;
      }
      td .emptymessage {
        padding: 8px 0;
        display: inline-block;
      }
    `,
  ],
})
export class PresetsPage implements OnInit {
  private readonly api = inject(PresetsApiService);
  private readonly translate = inject(TranslateService);

  readonly presets = signal<PresetDto[]>([]);
  readonly error = signal<string | undefined>(undefined);
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly busy = signal(false);

  formName = '';
  formDescription = '';
  formSpec = '{"format":"bv*+ba/b","subs":false,"thumb":false}';
  formDefault = false;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(undefined);
    try {
      this.presets.set(await this.api.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('presets.loadFailed'));
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formSpec = '{"format":"bv*+ba/b","subs":false,"thumb":false}';
    this.formDefault = false;
    this.dialogOpen.set(true);
  }

  openEdit(p: PresetDto): void {
    this.editingId.set(p.id);
    this.formName = p.name;
    this.formDescription = p.description ?? '';
    this.formSpec = p.specJson;
    this.formDefault = p.isDefault;
    this.dialogOpen.set(true);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const id = this.editingId();
      if (id)
        await this.api.update(id, {
          name: this.formName,
          description: this.formDescription || null,
          specJson: this.formSpec,
          isDefault: this.formDefault,
        });
      else
        await this.api.create({
          name: this.formName,
          description: this.formDescription || null,
          specJson: this.formSpec,
          isDefault: this.formDefault,
        });
      this.dialogOpen.set(false);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('common.saveFailed'));
    } finally {
      this.busy.set(false);
    }
  }

  async remove(p: PresetDto): Promise<void> {
    if (!globalThis.confirm(this.translate.instant('presets.deleteConfirm', { name: p.name }))) return;
    try {
      await this.api.delete(p.id);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('common.deleteFailed'));
    }
  }
}
