import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import type { JobArtifactDto, JobDetailDto, JobStatus } from '../../core/models/job.models';
import { artifactKindIcon, jobStatusPrimeIcon } from '../../core/ui/job-visuals';
import { DesktopBridgeService } from '../../core/services/desktop-bridge.service';
import { JobsApiService } from '../../core/services/jobs-api.service';

@Component({
  standalone: true,
  selector: 'app-job-detail-page',
  imports: [CommonModule, TranslateModule, RouterLink, ButtonModule, TableModule, TagModule, TooltipModule],
  template: `
    <div class="page">
      <div class="page__header">
        <a
          routerLink="/queue"
          class="back"
          [pTooltip]="'common.backToQueue' | translate"
          [attr.aria-label]="'common.backToQueue' | translate"
          ><i class="pi pi-arrow-left back__ico" aria-hidden="true"></i
          ><span class="sr-only">{{ 'nav.queue' | translate }}</span></a
        >
        <h1>{{ 'jobDetail.title' | translate }}</h1>
      </div>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      } @else if (job()) {
        @let j = job()!;
        <div class="meta card">
          <div class="row">
            <p-tag
              [value]="j.status"
              [severity]="severity(j.status)"
              [icon]="jobStatusPrimeIcon(j.status)"
              styleClass="job-detail-tag"
            ></p-tag>
            <span class="mono id">{{ j.id }}</span>
          </div>
          <p class="url mono">{{ j.url }}</p>
          <p class="muted">
            {{
              'jobDetail.platformLine'
                | translate
                  : {
                      platform: j.sourcePlatform,
                      priority: j.priority,
                      date: (j.createdAt | date: 'medium'),
                    }
            }}
          </p>
          @if (j.lastErrorMessage) {
            <p class="err-msg">{{ j.lastErrorMessage }}</p>
          }
        </div>

        @if (j.progress) {
          <section class="card">
            <h2>{{ 'jobDetail.progress' | translate }}</h2>
            <p>
              {{ 'jobDetail.phase' | translate }} <strong>{{ j.progress.phase }}</strong>
              @if (j.progress.percent != null) {
                — {{ j.progress.percent | number: '1.0-1' }}%
              }
            </p>
            @if (j.progress.bytesDone != null && j.progress.bytesTotal != null) {
              <p class="mono muted">
                {{
                  'jobDetail.progressBytes'
                    | translate
                      : {
                          done: (j.progress.bytesDone | number),
                          total: (j.progress.bytesTotal | number),
                        }
                }}
              </p>
            }
            <p class="muted small">
              {{ 'jobDetail.progressUpdated' | translate: { date: (j.progress.updatedAt | date: 'medium') } }}
            </p>
          </section>
        }

        <section class="card">
          <h2>{{ 'jobDetail.specJson' | translate }}</h2>
          <pre class="spec">{{ j.specJson }}</pre>
        </section>

        <section class="card">
          <h2>{{ 'jobDetail.artifacts' | translate }}</h2>
          @if (j.artifacts.length === 0) {
            <p class="muted">{{ 'jobDetail.noArtifacts' | translate }}</p>
          } @else {
            <p-table [value]="j.artifacts" [tableStyle]="{ 'min-width': '40rem' }">
              <ng-template pTemplate="header">
                <tr>
                  <th>{{ 'jobDetail.kind' | translate }}</th>
                  <th>{{ 'jobDetail.path' | translate }}</th>
                  <th>{{ 'jobDetail.size' | translate }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-a>
                <tr>
                  <td>
                    <i
                      class="artifact-kind pi md-job-ico md-job-ico--neutral"
                      [ngClass]="artifactKindIcon(a.kind)"
                      [pTooltip]="a.kind"
                      [attr.aria-label]="'common.kindWith' | translate: { value: a.kind }"
                    ></i>
                  </td>
                  <td class="mono path">{{ a.path }}</td>
                  <td class="mono">{{ a.sizeBytes != null ? (a.sizeBytes | number) : '—' }}</td>
                </tr>
              </ng-template>
            </p-table>
          }
        </section>

        @if (j.status === 'Completed' && primaryVideo(); as vid) {
          <div class="actions">
            @if (desktop.isDesktopShell()) {
              <button
                pButton
                type="button"
                class="p-button-secondary p-button-rounded"
                icon="pi pi-folder-open"
                [pTooltip]="'jobDetail.openFolder' | translate"
                [attr.aria-label]="'jobDetail.openDownloadFolder' | translate"
                (click)="openDownloadFolder(vid)"
                [disabled]="busy()"
              ></button>
              <button
                pButton
                type="button"
                class="p-button-rounded"
                icon="pi pi-play"
                [pTooltip]="'jobDetail.previewVideo' | translate"
                [attr.aria-label]="'jobDetail.previewVideoAria' | translate"
                (click)="previewVideo(vid)"
                [disabled]="busy()"
              ></button>
            } @else {
              <p class="muted desktop-hint">
                {{ 'jobDetail.desktopHint' | translate }}
              </p>
            }
          </div>
        }

        @if (canRetry(j.status)) {
          <div class="actions">
            <button
              pButton
              type="button"
              icon="pi pi-replay"
              class="p-button-success p-button-rounded"
              [pTooltip]="'history.retryTooltip' | translate"
              [attr.aria-label]="'jobDetail.retryNewJob' | translate"
              (click)="retry()"
              [disabled]="busy()"
            ></button>
          </div>
        }
      } @else {
        <p class="muted">{{ 'common.loading' | translate }}</p>
      }
    </div>
  `,
  styles: [
    `
      .page__header {
        margin-bottom: 12px;
      }
      .page__header h1 {
        margin: 8px 0 0;
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
      .back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--md-text-muted);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .back__ico {
        font-size: 0.95rem;
      }
      .back:hover {
        color: var(--md-text);
      }
      .artifact-kind {
        display: inline-flex;
      }
      .card {
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.08));
        background: rgba(0, 0, 0, 0.12);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .id {
        font-size: 0.85rem;
        color: var(--md-text-muted);
      }
      .url {
        word-break: break-all;
        margin: 10px 0 6px;
      }
      .muted {
        color: var(--md-text-muted);
        margin: 0;
      }
      .small {
        font-size: 0.85rem;
        margin-top: 6px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 1rem;
      }
      .spec {
        margin: 0;
        max-height: 280px;
        overflow: auto;
        font-size: 0.8rem;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .path {
        max-width: 420px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .err {
        color: #ff7a7a;
      }
      .err-msg {
        color: var(--p-orange-400, #fb923c);
        margin: 8px 0 0;
      }
      .actions {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .desktop-hint {
        margin: 0;
        max-width: 40rem;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class JobDetailPage implements OnInit {
  readonly jobStatusPrimeIcon = jobStatusPrimeIcon;
  readonly artifactKindIcon = artifactKindIcon;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobsApi = inject(JobsApiService);
  private readonly translate = inject(TranslateService);
  readonly desktop = inject(DesktopBridgeService);

  readonly job = signal<JobDetailDto | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Missing job id');
      return;
    }
    try {
      this.job.set(await this.jobsApi.getJob(id));
    } catch {
      this.error.set('Job not found or API unreachable.');
    }
  }

  primaryVideo(): JobArtifactDto | null {
    const j = this.job();
    if (!j?.artifacts?.length) return null;
    const v = j.artifacts.find((a) => a.kind?.toLowerCase() === 'video');
    return v?.path ? v : null;
  }

  async openDownloadFolder(artifact: JobArtifactDto): Promise<void> {
    try {
      await this.desktop.showItemInFolder(artifact.path);
    } catch (e) {
      globalThis.alert(
        e instanceof Error ? e.message : this.translate.instant('jobDetail.openFolderFailed'),
      );
    }
  }

  async previewVideo(artifact: JobArtifactDto): Promise<void> {
    try {
      await this.desktop.previewVideo(artifact.path);
    } catch (e) {
      globalThis.alert(
        e instanceof Error ? e.message : this.translate.instant('jobDetail.previewVideoFailed'),
      );
    }
  }

  canRetry(status: JobStatus): boolean {
    return status === 'Failed' || status === 'FailedPermanent' || status === 'Cancelled' || status === 'Completed';
  }

  async retry(): Promise<void> {
    const j = this.job();
    if (!j) return;
    if (!globalThis.confirm(this.translate.instant('jobDetail.retryConfirm'))) return;
    this.busy.set(true);
    try {
      const r = await this.jobsApi.retryJob(j.id);
      await this.router.navigate(['/jobs', r.id], { replaceUrl: true });
      this.job.set(await this.jobsApi.getJob(r.id));
      this.error.set(undefined);
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : this.translate.instant('jobDetail.retryFailed'),
      );
    } finally {
      this.busy.set(false);
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
