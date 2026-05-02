import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { JobsApiService } from '../../core/services/jobs-api.service';
import type { JobSummaryDto } from '../../core/models/job.models';

@Component({
  standalone: true,
  selector: 'app-history-page',
  imports: [CommonModule, TableModule],
  template: `
    <div class="page">
      <h1>History</h1>
      <p class="muted">Completed + terminal jobs (filters in Phase 2).</p>

      <p-table [value]="jobs()" [tableStyle]="{ 'min-width': '50rem' }" [scrollable]="true" scrollHeight="560px">
        <ng-template pTemplate="header">
          <tr>
            <th>Status</th>
            <th>Platform</th>
            <th>URL</th>
            <th>Completed</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-job>
          <tr>
            <td>{{ job.status }}</td>
            <td>{{ job.sourcePlatform }}</td>
            <td class="mono url">{{ job.url }}</td>
            <td class="mono">{{ job.createdAt | date: 'short' }}</td>
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
    `,
  ],
})
export class HistoryPage implements OnInit {
  private readonly jobsApi = inject(JobsApiService);
  readonly jobs = signal<JobSummaryDto[]>([]);

  async ngOnInit(): Promise<void> {
    const all = await this.jobsApi.listJobs(500);
    this.jobs.set(all.filter((j) => j.status === 'Completed' || j.status === 'FailedPermanent' || j.status === 'Cancelled'));
  }
}
