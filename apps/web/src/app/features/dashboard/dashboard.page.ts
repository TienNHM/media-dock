import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs';
import { CardModule } from 'primeng/card';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { JobsRealtimeService } from '../../core/services/jobs-realtime.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, TranslateModule, CardModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>{{ 'dashboard.title' | translate }}</h1>
        <p class="muted">{{ 'dashboard.subtitle' | translate }}</p>
      </div>

      <div class="grid">
        <p-card>
          <ng-template pTemplate="header">
            <div class="kpi-head">
              <i class="pi pi-bolt"></i><span>{{ 'dashboard.activeJobs' | translate }}</span>
            </div>
          </ng-template>
          <p class="kpi">{{ active() }}</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="header">
            <div class="kpi-head">
              <i class="pi pi-list"></i><span>{{ 'dashboard.queued' | translate }}</span>
            </div>
          </ng-template>
          <p class="kpi">{{ queued() }}</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="header">
            <div class="kpi-head">
              <i class="pi pi-times-circle"></i><span>{{ 'dashboard.failedRecent' | translate }}</span>
            </div>
          </ng-template>
          <p class="kpi">{{ failed() }}</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="header">
            <div class="kpi-head">
              <i class="pi pi-heart"></i><span>{{ 'dashboard.queueHealth' | translate }}</span>
            </div>
          </ng-template>
          <p class="kpi muted">{{ health() }}</p>
        </p-card>
      </div>
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
      .kpi-head {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 650;
      }
      .kpi-head .pi {
        opacity: 0.85;
        font-size: 1rem;
      }
      .grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      @media (max-width: 1100px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .kpi {
        font-size: 28px;
        font-weight: 650;
        margin: 0;
      }
    `,
  ],
})
export class DashboardPage implements OnInit {
  private readonly jobsApi = inject(JobsApiService);
  private readonly realtime = inject(JobsRealtimeService);
  private readonly translate = inject(TranslateService);

  readonly active = signal(0);
  readonly queued = signal(0);
  readonly failed = signal(0);
  readonly health = signal('');

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.updateHealthLabel());
    toObservable(this.realtime.lastProgress)
      .pipe(debounceTime(750), takeUntilDestroyed())
      .subscribe(() => void this.refresh());
  }

  private updateHealthLabel(): void {
    this.health.set(
      this.failed() > 0
        ? this.translate.instant('dashboard.needsAttention')
        : this.translate.instant('dashboard.healthy'),
    );
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    const jobs = await this.jobsApi.listJobs(500);
    this.queued.set(
      jobs.filter((j) => j.status === 'Queued' || j.status === 'Downloading' || j.status === 'Probing').length,
    );
    this.failed.set(jobs.filter((j) => j.status === 'Failed' || j.status === 'FailedPermanent').length);
    this.active.set(jobs.filter((j) => j.status === 'Downloading' || j.status === 'Probing').length);
    this.updateHealthLabel();
  }
}
