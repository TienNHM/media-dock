import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { JobsApiService } from '@app/core/services/jobs-api.service';
import { JobsRealtimeService } from '@app/core/services/jobs-realtime.service';
import { jobPlatformIconClasses, jobStatusPrimeIcon } from '@app/core/ui/job-visuals';
import { QueueStore } from '@app/core/state/queue.store';

@Component({
  standalone: true,
  selector: 'app-queue-page',
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>{{ 'queue.title' | translate }}</h1>
        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          class="p-button-outlined"
          [pTooltip]="'queue.refreshQueue' | translate"
          [attr.aria-label]="'queue.refreshQueue' | translate"
          (click)="store.refresh()"
        ></button>
      </div>

      @if (store.error()) {
        <p class="err">{{ store.error() }}</p>
      }

      <p-table [value]="activeJobs()" [tableStyle]="{ 'min-width': '64rem' }" [scrollable]="true" scrollHeight="560px">
        <ng-template pTemplate="header">
          <tr>
            <th scope="col" class="col-tag">
              <span class="sr-only">{{ 'common.status' | translate }}</span>
              <i
                class="pi pi-flag"
                aria-hidden="true"
                [pTooltip]="'common.status' | translate"
                tooltipPosition="bottom"
              ></i>
            </th>
            <th scope="col" class="col-plat">
              <span class="sr-only">{{ 'common.platform' | translate }}</span>
              <i
                class="pi pi-desktop"
                aria-hidden="true"
                [pTooltip]="'common.platform' | translate"
                tooltipPosition="bottom"
              ></i>
            </th>
            <th scope="col">{{ 'common.url' | translate }}</th>
            <th scope="col">{{ 'common.priority' | translate }}</th>
            <th scope="col">{{ 'common.created' | translate }}</th>
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
        <ng-template pTemplate="body" let-job>
          <tr>
            <td class="col-tag">
              <p-tag
                [value]="job.status"
                [icon]="jobStatusPrimeIcon(job.status)"
                [severity]="severity(job.status)"
                styleClass="queue-tag"
                [rounded]="false"
              />
            </td>
            <td class="col-plat">
              <i
                class="md-job-ico md-job-ico--neutral"
                [ngClass]="jobPlatformIconClasses(job.sourcePlatform)"
                [pTooltip]="job.sourcePlatform"
                tooltipPosition="top"
                [attr.aria-label]="'common.platformWith' | translate: { value: job.sourcePlatform }"
              ></i>
            </td>
            <td class="mono url">{{ job.url }}</td>
            <td>{{ job.priority }}</td>
            <td class="mono">{{ job.createdAt | date: 'short' }}</td>
            <td class="actions-cell">
              <a
                pButton
                [routerLink]="['/jobs', job.id]"
                icon="pi pi-eye"
                class="p-button-text p-button-rounded p-button-sm"
                [pTooltip]="'queue.openJobDetails' | translate"
                [attr.aria-label]="'queue.openJobDetails' | translate"
              ></a>
              @if (canCancel(job.status)) {
                <button
                  pButton
                  type="button"
                  icon="pi pi-times"
                  class="p-button-text p-button-rounded p-button-sm p-button-danger"
                  [pTooltip]="'queue.cancelJob' | translate"
                  [attr.aria-label]="'queue.cancelJob' | translate"
                  (click)="cancel(job.id)"
                ></button>
              }
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
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .page__header h1 {
        margin: 0;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .col-tag :deep(.p-tag),
      .col-tag :deep(span.p-tag) {
        max-width: 100%;
      }
      .col-tag {
        vertical-align: middle;
      }
      .col-plat {
        width: 3rem;
        text-align: center;
      }
      .col-actions {
        width: 5.5rem;
        text-align: center;
      }
      .queue-tag {
        gap: 0.35rem;
      }
      .url {
        max-width: 480px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .err {
        color: #ff7a7a;
      }
      .actions-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
      }
    `,
  ],
})
export class QueuePage implements OnInit {
  readonly store = inject(QueueStore);
  private readonly jobsApi = inject(JobsApiService);
  private readonly realtime = inject(JobsRealtimeService);
  private readonly translate = inject(TranslateService);

  readonly jobStatusPrimeIcon = jobStatusPrimeIcon;
  readonly jobPlatformIconClasses = jobPlatformIconClasses;

  readonly activeJobs = computed(() =>
    this.store
      .jobs()
      .filter((j) =>
        ['Queued', 'Probing', 'Downloading', 'Pending', 'Retrying', 'Paused', 'Scheduled', 'PostProcessing'].includes(
          j.status,
        ),
      ),
  );

  constructor() {
    toObservable(this.realtime.lastProgress)
      .pipe(debounceTime(750), takeUntilDestroyed())
      .subscribe(() => void this.store.refresh());
  }

  async ngOnInit(): Promise<void> {
    await this.store.refresh();
  }

  canCancel(status: string): boolean {
    return ['Queued', 'Probing', 'Downloading', 'Pending', 'Retrying', 'Scheduled', 'PostProcessing'].includes(status);
  }

  async cancel(id: string): Promise<void> {
    if (!globalThis.confirm(this.translate.instant('queue.cancelConfirm'))) return;
    try {
      await this.jobsApi.cancelJob(id);
      await this.store.refresh();
    } catch {
      await this.store.refresh();
    }
  }

  severity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Failed':
      case 'FailedPermanent':
        return 'danger';
      case 'Downloading':
      case 'Probing':
        return 'info';
      case 'Queued':
        return 'secondary';
      default:
        return 'warn';
    }
  }
}
