import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { QueueStore } from '../../core/state/queue.store';

@Component({
  standalone: true,
  selector: 'app-queue-page',
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Queue</h1>
        <button pButton type="button" label="Refresh" (click)="store.refresh()"></button>
      </div>

      @if (store.error()) {
        <p class="err">{{ store.error() }}</p>
      }

      <p-table [value]="store.jobs()" [tableStyle]="{ 'min-width': '60rem' }" [scrollable]="true" scrollHeight="560px">
        <ng-template pTemplate="header">
          <tr>
            <th>Status</th>
            <th>Platform</th>
            <th>URL</th>
            <th>Priority</th>
            <th>Created</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-job>
          <tr>
            <td><p-tag [value]="job.status" [severity]="severity(job.status)"></p-tag></td>
            <td>{{ job.sourcePlatform }}</td>
            <td class="mono url">{{ job.url }}</td>
            <td>{{ job.priority }}</td>
            <td class="mono">{{ job.createdAt | date: 'short' }}</td>
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
        max-width: 520px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .err {
        color: #ff7a7a;
      }
    `,
  ],
})
export class QueuePage implements OnInit {
  readonly store = inject(QueueStore);

  async ngOnInit(): Promise<void> {
    await this.store.refresh();
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
