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
import type { ScheduleDto } from '@app/core/models/job.models';
import { SchedulesApiService } from '@app/core/services/schedules-api.service';

@Component({
  standalone: true,
  selector: 'app-schedules-page',
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
        <h1>{{ 'schedules.title' | translate }}</h1>
        <button
          pButton
          type="button"
          icon="pi pi-plus"
          [label]="'common.newSchedule' | translate"
          [pTooltip]="'schedules.createTooltip' | translate"
          (click)="openCreate()"
        ></button>
      </div>
      <p class="muted">
        {{
          'schedules.subtitle'
            | translate: { example: ('schedules.cronExample' | translate), template: templateExample }
        }}
      </p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <p-table [value]="schedules()" [tableStyle]="{ 'min-width': '56rem' }">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'common.enabled' | translate }}</th>
            <th>{{ 'common.cron' | translate }}</th>
            <th>{{ 'common.tz' | translate }}</th>
            <th>{{ 'common.next' | translate }}</th>
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
        <ng-template pTemplate="body" let-s>
          <tr>
            <td>{{ s.enabled }}</td>
            <td class="mono">{{ s.cron }}</td>
            <td>{{ s.timezone }}</td>
            <td class="mono">{{ s.nextRunAt | date: 'short' }}</td>
            <td class="actions">
              <button
                pButton
                type="button"
                class="p-button-text p-button-rounded p-button-sm"
                icon="pi pi-pencil"
                [pTooltip]="'common.edit' | translate"
                [attr.aria-label]="'schedules.editSchedule' | translate"
                (click)="openEdit(s)"
              ></button>
              <button
                pButton
                type="button"
                class="p-button-text p-button-rounded p-button-sm p-button-danger"
                icon="pi pi-trash"
                [pTooltip]="'common.delete' | translate"
                [attr.aria-label]="'schedules.deleteAria' | translate"
                (click)="remove(s)"
              ></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [header]="(editingId() ? 'schedules.editSchedule' : 'schedules.newSchedule') | translate"
      [visible]="dialogOpen()"
      (visibleChange)="dialogOpen.set($event)"
      [modal]="true"
      [style]="{ width: 'min(720px, 94vw)' }"
    >
      <div class="form">
        <label>{{ 'schedules.cron' | translate }}</label>
        <input pInputText [(ngModel)]="formCron" class="w-full mono" placeholder="*/15 * * * *" />
        <label>{{ 'schedules.timezone' | translate }}</label>
        <input pInputText [(ngModel)]="formTz" class="w-full" />
        <label>{{ 'schedules.jobTemplateJson' | translate }}</label>
        <textarea pTextarea [(ngModel)]="formTemplate" rows="6" class="w-full mono"></textarea>
        <label class="row-check"
          ><input type="checkbox" [(ngModel)]="formEnabled" /> {{ 'schedules.enabledCheck' | translate }}</label
        >
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          icon="pi pi-times"
          class="p-button-text p-button-rounded"
          [pTooltip]="'common.cancel' | translate"
          [attr.aria-label]="'common.cancel' | translate"
          (click)="dialogOpen.set(false)"
        ></button>
        <button
          pButton
          type="button"
          icon="pi pi-check"
          [label]="'common.save' | translate"
          [attr.aria-label]="'schedules.saveSchedule' | translate"
          (click)="save()"
          [disabled]="busy()"
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
    `,
  ],
})
export class SchedulesPage implements OnInit {
  readonly templateExample = '{"url":"https://…","priority":0,"presetId":null}';

  private readonly api = inject(SchedulesApiService);
  private readonly translate = inject(TranslateService);

  readonly schedules = signal<ScheduleDto[]>([]);
  readonly error = signal<string | undefined>(undefined);
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly busy = signal(false);

  formCron = '*/30 * * * *';
  formTz = 'UTC';
  formTemplate = '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","priority":0}';
  formEnabled = true;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(undefined);
    try {
      this.schedules.set(await this.api.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('schedules.loadFailed'));
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formCron = '*/30 * * * *';
    this.formTz = 'UTC';
    this.formTemplate = '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","priority":0}';
    this.formEnabled = true;
    this.dialogOpen.set(true);
  }

  openEdit(s: ScheduleDto): void {
    this.editingId.set(s.id);
    this.formCron = s.cron;
    this.formTz = s.timezone;
    this.formTemplate = s.jobTemplateJson;
    this.formEnabled = s.enabled;
    this.dialogOpen.set(true);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const id = this.editingId();
      if (id)
        await this.api.update(id, {
          cron: this.formCron,
          timezone: this.formTz,
          jobTemplateJson: this.formTemplate,
          enabled: this.formEnabled,
        });
      else
        await this.api.create({
          cron: this.formCron,
          timezone: this.formTz,
          jobTemplateJson: this.formTemplate,
          enabled: this.formEnabled,
        });
      this.dialogOpen.set(false);
      await this.load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'error' in e
          ? JSON.stringify((e as { error?: unknown }).error)
          : e instanceof Error
            ? e.message
            : this.translate.instant('common.saveFailed');
      this.error.set(msg);
    } finally {
      this.busy.set(false);
    }
  }

  async remove(s: ScheduleDto): Promise<void> {
    if (!globalThis.confirm(this.translate.instant('schedules.deleteConfirm'))) return;
    try {
      await this.api.delete(s.id);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : this.translate.instant('common.deleteFailed'));
    }
  }
}
