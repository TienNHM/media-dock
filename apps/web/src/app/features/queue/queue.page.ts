import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { JobsRealtimeService } from '../../core/services/jobs-realtime.service';
import { QueueStore } from '../../core/state/queue.store';

@Component({
  standalone: true,
  selector: 'app-queue-page',
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Queue</h1>
        <button pButton type="button" label="Refresh" (click)="store.refresh()"></button>
      </div>

      @if (store.error()) {
        <p class="err">{{ store.error() }}</p>
      }

      <p-table [value]="activeJobs()" [tableStyle]="{ 'min-width': '64rem' }" [scrollable]="true" scrollHeight="560px">
        <ng-template pTemplate="header">
          <tr>
            <th>Status</th>
            <th>Platform</th>
            <th>URL</th>
            <th>Priority</th>
            <th>Created</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-job>
          <tr>
            <td><p-tag [value]="job.status" [severity]="severity(job.status)"></p-tag></td>
            <td>{{ job.sourcePlatform }}</td>
            <td class="mono url">{{ job.url }}</td>
            <td>{{ job.priority }}</td>
            <td class="mono">{{ job.createdAt | date: 'short' }}</td>
            <td>
              <a class="details-link" [routerLink]="['/jobs', job.id]">Details</a>
              @if (canCancel(job.status)) {
                <button
                  pButton
                  type="button"
                  class="p-button-text p-button-danger"
                  label="Cancel"
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
      .url {
        max-width: 480px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .err {
        color: #ff7a7a;
      }
      .details-link {
        margin-right: 8px;
        color: var(--p-primary-color, #8ab4ff);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .details-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class QueuePage implements OnInit {
  readonly store = inject(QueueStore);
  private readonly jobsApi = inject(JobsApiService);
  private readonly realtime = inject(JobsRealtimeService);

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
    if (!globalThis.confirm('Cancel this job?')) return;
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
