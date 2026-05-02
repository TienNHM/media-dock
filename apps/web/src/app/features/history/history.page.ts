import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { JobsApiService } from '../../core/services/jobs-api.service';
import type { JobStatus, JobSummaryDto } from '../../core/models/job.models';

@Component({
  standalone: true,
  selector: 'app-history-page',
  imports: [CommonModule, RouterLink, ButtonModule, TableModule],
  template: `
    <div class="page">
      <h1>History</h1>
      <p class="muted">Completed, failed, and cancelled jobs.</p>

      <p-table [value]="jobs()" [tableStyle]="{ 'min-width': '50rem' }" [scrollable]="true" scrollHeight="560px">
        <ng-template pTemplate="header">
          <tr>
            <th>Status</th>
            <th>Platform</th>
            <th>URL</th>
            <th>Completed</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-job>
          <tr>
            <td>{{ job.status }}</td>
            <td>{{ job.sourcePlatform }}</td>
            <td class="mono url">{{ job.url }}</td>
            <td class="mono">{{ (job.completedAt || job.createdAt) | date: 'short' }}</td>
            <td>
              <a class="details-link" [routerLink]="['/jobs', job.id]">Details</a>
              @if (canRetry(job.status)) {
                <button
                  pButton
                  type="button"
                  class="p-button-text"
                  label="Retry"
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
      .url {
        max-width: 520px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
export class HistoryPage implements OnInit {
  private readonly jobsApi = inject(JobsApiService);
  private readonly router = inject(Router);
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
