import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { JobsApiService } from '../../core/services/jobs-api.service';

@Component({
  standalone: true,
  selector: 'app-acquire-page',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Acquire</h1>
        <p class="muted">Quick capture from a single URL (batch + schedules land in Phase 2).</p>
      </div>

      <div class="row">
        <input pInputText type="url" placeholder="https://…" [(ngModel)]="url" class="grow" />
        <button pButton type="button" label="Enqueue" (click)="submit()" [disabled]="busy() || !url"></button>
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
      .row {
        margin-top: 16px;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .grow {
        flex: 1;
      }
      .msg {
        margin-top: 12px;
        color: var(--md-text-muted);
      }
    `,
  ],
})
export class AcquirePage {
  private readonly jobsApi = inject(JobsApiService);

  url = '';
  readonly busy = signal(false);
  readonly message = signal<string | undefined>(undefined);

  async submit(): Promise<void> {
    this.busy.set(true);
    this.message.set(undefined);
    try {
      const r = await this.jobsApi.createJob(this.url.trim(), 0);
      this.message.set(`Queued job ${r.id}`);
      this.url = '';
    } catch (e) {
      this.message.set(e instanceof Error ? e.message : 'Failed to queue job');
    } finally {
      this.busy.set(false);
    }
  }
}
