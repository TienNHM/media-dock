import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { jobPlatformIconClasses, jobStatusDisplayClasses } from '../../core/ui/job-visuals';
import { JobsApiService } from '../../core/services/jobs-api.service';
import type { JobStatus, JobSummaryDto } from '../../core/models/job.models';

@Component({
  standalone: true,
  selector: 'app-history-page',
  imports: [CommonModule, RouterLink, ButtonModule, TableModule, TooltipModule],
  template: `
    <div class="page">
      <h1>History</h1>
      <p class="muted">Completed, failed, and cancelled jobs.</p>

      <p-table [value]="jobs()" [tableStyle]="{ 'min-width': '50rem' }" [scrollable]="true" scrollHeight="560px">
        <ng-template pTemplate="header">
          <tr>
            <th scope="col" class="col-icon">
              <span class="sr-only">Status</span>
              <i class="pi pi-flag" aria-hidden="true" pTooltip="Status" tooltipPosition="bottom"></i>
            </th>
            <th scope="col" class="col-icon">
              <span class="sr-only">Platform</span>
              <i class="pi pi-desktop" aria-hidden="true" pTooltip="Platform" tooltipPosition="bottom"></i>
            </th>
            <th scope="col">URL</th>
            <th scope="col">Completed</th>
            <th scope="col" class="col-actions">
              <span class="sr-only">Actions</span>
              <i class="pi pi-bolt" aria-hidden="true" pTooltip="Actions" tooltipPosition="bottom"></i>
            </th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-job>
          <tr>
            <td class="col-icon">
              <i
                [ngClass]="jobStatusDisplayClasses(job.status)"
                [pTooltip]="job.status"
                tooltipPosition="top"
                [attr.aria-label]="'Status: ' + job.status"
              ></i>
            </td>
            <td class="col-icon">
              <i
                class="md-job-ico md-job-ico--neutral"
                [ngClass]="jobPlatformIconClasses(job.sourcePlatform)"
                [pTooltip]="job.sourcePlatform"
                tooltipPosition="top"
                [attr.aria-label]="'Platform: ' + job.sourcePlatform"
              ></i>
            </td>
            <td class="mono url">{{ job.url }}</td>
            <td class="mono">{{ (job.completedAt || job.createdAt) | date: 'short' }}</td>
            <td class="actions-cell">
              <a
                pButton
                [routerLink]="['/jobs', job.id]"
                icon="pi pi-eye"
                class="p-button-text p-button-rounded p-button-sm"
                [pTooltip]="'Open job'"
                [attr.aria-label]="'Open job details'"
              ></a>
              @if (canRetry(job.status)) {
                <button
                  pButton
                  type="button"
                  icon="pi pi-replay"
                  class="p-button-text p-button-rounded p-button-sm p-button-success"
                  [pTooltip]="'Retry — new job from this URL'"
                  [attr.aria-label]="'Retry job'"
                  (click)="retry(job.id)"
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
      h1 {
        margin: 0 0 6px;
      }
      .muted {
        color: var(--md-text-muted);
        margin: 0 0 12px;
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
      .col-icon {
        width: 3rem;
        text-align: center;
        vertical-align: middle;
      }
      .col-actions {
        width: 5.5rem;
        text-align: center;
        vertical-align: middle;
      }
      .url {
        max-width: 520px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .actions-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex-wrap: nowrap;
      }
    `,
  ],
})
export class HistoryPage implements OnInit {
  private readonly jobsApi = inject(JobsApiService);
  private readonly router = inject(Router);

  readonly jobStatusDisplayClasses = jobStatusDisplayClasses;
  readonly jobPlatformIconClasses = jobPlatformIconClasses;

  readonly jobs = signal<JobSummaryDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadJobs();
  }

  private async loadJobs(): Promise<void> {
    try {
      const all = await this.jobsApi.listJobs(500);
      this.jobs.set(
        all.filter(
          (j) =>
            j.status === 'Completed' ||
            j.status === 'Failed' ||
            j.status === 'FailedPermanent' ||
            j.status === 'Cancelled',
        ),
      );
    } catch {
      this.jobs.set([]);
    }
  }

  canRetry(status: JobStatus): boolean {
    return status === 'Failed' || status === 'FailedPermanent' || status === 'Cancelled' || status === 'Completed';
  }

  async retry(id: string): Promise<void> {
    if (!globalThis.confirm('Create a new job from this one?')) return;
    try {
      const r = await this.jobsApi.retryJob(id);
      await this.loadJobs();
      await this.router.navigate(['/jobs', r.id]);
    } catch {
      /* toast-less MVP */
    }
  }
}
