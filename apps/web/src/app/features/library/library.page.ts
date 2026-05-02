import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import type { LibraryItemDto } from '../../core/models/job.models';
import { jobPlatformIconClasses } from '../../core/ui/job-visuals';
import { DesktopBridgeService } from '../../core/services/desktop-bridge.service';
import { LibraryApiService } from '../../core/services/library-api.service';

@Component({
  standalone: true,
  selector: 'app-library-page',
  imports: [CommonModule, RouterLink, ButtonModule, TooltipModule],
  template: `
    <div class="page library">
      <header class="library__masthead">
        <div class="library__intro">
          <h1>Library</h1>
          <p class="library__subtitle">
            Finished downloads — inline preview streams from your sidecar (<code>/api/library/…/preview</code>).
          </p>
        </div>
        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          class="p-button-outlined p-button-rounded"
          [pTooltip]="'Refresh library'"
          [attr.aria-label]="'Refresh library'"
          (click)="load()"
          [loading]="loading()"
        ></button>
      </header>

      @if (error()) {
        <p class="library__banner library__banner--err" role="alert">{{ error() }}</p>
      }

      @if (!loading() && !items().length && !error()) {
        <div class="library__empty">
          <span class="pi pi-inbox library__empty-icon" aria-hidden="true"></span>
          <p class="library__empty-title">No completed items yet</p>
          <p class="library__empty-hint muted">Enqueue a URL from Acquire, then return here.</p>
        </div>
      }

      <div class="library__grid" role="feed" aria-label="Library items">
        @for (item of items(); track item.jobId) {
          @let vid = primaryVideo(item);
          <article class="lib-card">
            <div class="lib-card__media">
              @if (vid && !previewFailed().has(item.jobId)) {
                <video
                  class="lib-card__video"
                  controls
                  preload="metadata"
                  playsinline
                  controlsList="nodownload"
                  [attr.poster]="posterUrl(item) ?? null"
                  [src]="api.previewUrl(item.jobId, vid.id)"
                  (error)="markPreviewFailed(item.jobId)"
                ></video>
              } @else {
                @if (posterUrl(item); as pu) {
                  <img class="lib-card__thumb" [src]="pu" alt="" loading="lazy" />
                } @else {
                  @if (primaryAudio(item); as au) {
                    <div class="lib-card__audio-wrap">
                      <span class="pi pi-volume-up lib-card__audio-icon" aria-hidden="true"></span>
                      <audio
                        controls
                        preload="metadata"
                        class="lib-card__audio"
                        [src]="api.previewUrl(item.jobId, au.id)"
                      ></audio>
                    </div>
                  } @else {
                    <div class="lib-card__fallback" aria-hidden="true">
                      <span class="pi pi-file"></span>
                    </div>
                  }
                }
              }
            </div>

            <div class="lib-card__body">
              <h2 class="lib-card__title" [pTooltip]="detailHint(item)" tooltipPosition="top">
                {{ displayTitle(item) }}
              </h2>

              <div class="lib-card__meta">
                <i
                  class="lib-card__plat pi md-job-ico md-job-ico--neutral"
                  [ngClass]="jobPlatformIconClasses(item.sourcePlatform)"
                  [pTooltip]="item.sourcePlatform"
                  [attr.aria-label]="'Platform: ' + item.sourcePlatform"
                ></i>
                <span class="lib-card__date">{{ item.completedAt | date: 'medium' }}</span>
                @if (vid && vid.sizeBytes != null) {
                  <span class="lib-card__size mono">{{ formatBytes(vid.sizeBytes!) }}</span>
                }
              </div>

              <div class="lib-card__actions">
                <button
                  pButton
                  type="button"
                  class="p-button-text p-button-sm p-button-rounded"
                  [routerLink]="['/jobs', item.jobId]"
                  icon="pi pi-link"
                  [pTooltip]="'Open job'"
                  [attr.aria-label]="'Open job'"
                ></button>
                <a
                  pButton
                  type="button"
                  class="p-button-text p-button-sm p-button-rounded"
                  [href]="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon="pi pi-external-link"
                  [pTooltip]="'Open source URL'"
                  [attr.aria-label]="'Open source URL'"
                ></a>
                @if (vid && desktop.isDesktopShell()) {
                  <button
                    pButton
                    type="button"
                    class="p-button-text p-button-sm p-button-rounded"
                    icon="pi pi-folder-open"
                    [pTooltip]="'Show in folder'"
                    [attr.aria-label]="'Show in folder'"
                    (click)="openFolder(vid.path)"
                  ></button>
                  <button
                    pButton
                    type="button"
                    class="p-button-text p-button-sm p-button-rounded"
                    icon="pi pi-play"
                    [pTooltip]="'Preview locally'"
                    [attr.aria-label]="'Preview video locally'"
                    (click)="previewLocal(vid.path)"
                  ></button>
                }
                @if (vid ?? primaryThumbnail(item); as primary) {
                  <button
                    pButton
                    type="button"
                    class="p-button-text p-button-sm p-button-rounded"
                    icon="pi pi-copy"
                    [pTooltip]="copyHint(item.jobId)"
                    tooltipPosition="left"
                    [attr.aria-label]="'Copy file path'"
                    (click)="copyPath(item.jobId, primary.path)"
                  ></button>
                }
                <button
                  pButton
                  type="button"
                  class="p-button-text p-button-sm p-button-danger ml-auto p-button-rounded"
                  icon="pi pi-trash"
                  severity="danger"
                  [pTooltip]="'Remove from library'"
                  [attr.aria-label]="'Remove from library'"
                  [loading]="removingJobId() === item.jobId"
                  [disabled]="removingJobId() !== null"
                  (click)="confirmRemove(item)"
                ></button>
              </div>

              @if (item.files.length) {
                <details class="lib-card__technical">
                  <summary>Paths & extras ({{ item.files.length }})</summary>
                  <ul class="lib-files">
                    @for (f of item.files; track f.id) {
                      <li>
                        <span class="mono lib-files__kind">{{ f.kind }}</span>
                        <span class="mono lib-files__name">{{ fileNameOnly(f.path) }}</span>
                        @if (f.sizeBytes != null) {
                          <span class="muted lib-files__sz">{{ formatBytes(f.sizeBytes) }}</span>
                        }
                      </li>
                    }
                  </ul>
                </details>
              }
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .library__masthead {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      .library__intro h1 {
        margin: 0 0 6px;
        font-weight: 650;
      }
      .library__subtitle {
        margin: 0;
        max-width: 36rem;
        font-size: 0.92rem;
        color: var(--md-text-muted);
        line-height: 1.45;
      }
      .library__subtitle code {
        font-size: 0.78em;
        word-break: break-all;
      }
      .library__banner {
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 0.9rem;
      }
      .library__banner--err {
        background: rgba(248, 113, 113, 0.12);
        color: #fca5a5;
        margin: 12px 0 0;
      }
      .library__empty {
        margin: 48px auto;
        max-width: 22rem;
        text-align: center;
        padding: 24px;
      }
      .library__empty-icon {
        font-size: 2.5rem;
        color: var(--md-text-muted);
        opacity: 0.5;
      }
      .library__empty-title {
        margin: 12px 0 4px;
        font-weight: 600;
      }
      .library__empty-hint {
        margin: 0;
        font-size: 0.9rem;
      }
      .library__grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
        gap: 18px;
        align-items: start;
      }
      .lib-card {
        border-radius: 12px;
        border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.09));
        background: var(--md-surface-1, rgba(18, 20, 26, 0.86));
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .lib-card__media {
        position: relative;
        aspect-ratio: 16 / 9;
        background: #07080a;
      }
      .lib-card__video,
      .lib-card__thumb {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .lib-card__thumb {
        object-fit: cover;
      }
      .lib-card__fallback {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--md-text-muted);
      }
      .lib-card__fallback .pi {
        font-size: 2.25rem;
        opacity: 0.35;
      }
      .lib-card__audio-wrap {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        gap: 8px;
        padding: 12px;
      }
      .lib-card__audio-icon {
        align-self: center;
        opacity: 0.4;
        font-size: 1.25rem;
      }
      .lib-card__audio {
        width: 100%;
      }
      .lib-card__body {
        padding: 12px 14px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 0;
      }
      .lib-card__title {
        margin: 0;
        font-size: 0.98rem;
        font-weight: 650;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .lib-card__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        row-gap: 6px;
      }
      .lib-card__plat {
        line-height: 1;
      }
      .lib-card__date,
      .lib-card__size {
        font-size: 0.82rem;
        color: var(--md-text-muted);
      }
      .lib-card__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        align-items: center;
        padding-top: 2px;
        border-top: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
      }
      .lib-card__actions .ml-auto {
        margin-inline-start: auto;
      }
      .lib-card__technical {
        font-size: 0.82rem;
        color: var(--md-text-muted);
      }
      .lib-card__technical summary {
        cursor: pointer;
        user-select: none;
      }
      .lib-card__technical summary:hover {
        color: var(--md-text);
      }
      .lib-files {
        margin: 8px 0 0;
        padding-left: 1rem;
      }
      .lib-files li {
        margin-bottom: 4px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 8px;
        align-items: baseline;
      }
      .lib-files__kind {
        color: var(--md-text-muted);
        font-size: 0.75rem;
      }
      .lib-files__name {
        word-break: break-word;
        font-size: 0.76rem;
        color: rgba(226, 232, 240, 0.9);
      }
      .lib-files__sz {
        font-size: 0.74rem;
        white-space: nowrap;
      }
      .muted {
        color: var(--md-text-muted);
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
    `,
  ],
})
export class LibraryPage implements OnInit {
  readonly jobPlatformIconClasses = jobPlatformIconClasses;
  readonly api = inject(LibraryApiService);
  readonly desktop = inject(DesktopBridgeService);

  readonly items = signal<LibraryItemDto[]>([]);
  readonly error = signal<string | undefined>(undefined);
  readonly loading = signal(false);
  /** Jobs where <video> element failed load (_codec / range / CORS) — poster or thumbnail may still apply. */
  readonly previewFailed = signal(new Set<string>());
  readonly copyFlash = signal<string | null>(null);
  readonly removingJobId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  primaryVideo(item: LibraryItemDto) {
    return item.files.find((f) => f.kind?.toLowerCase() === 'video') ?? null;
  }

  primaryThumbnail(item: LibraryItemDto) {
    return item.files.find((f) => f.kind?.toLowerCase() === 'thumbnail') ?? null;
  }

  primaryAudio(item: LibraryItemDto) {
    return item.files.find((f) => f.kind?.toLowerCase() === 'audio') ?? null;
  }

  posterUrl(item: LibraryItemDto): string | null {
    const th = this.primaryThumbnail(item);
    return th ? this.api.previewUrl(item.jobId, th.id) : null;
  }

  displayTitle(item: LibraryItemDto): string {
    const v = this.primaryVideo(item);
    const audio = this.primaryAudio(item);
    const path = v?.path ?? audio?.path ?? item.files[0]?.path ?? '';
    if (path) {
      const leaf = path.split(/[/\\]/).pop() ?? '';
      const noExt = leaf.replace(/\.[^/.]+$/, '');
      const t = (noExt || leaf).trim();
      if (t) return this.clampChars(t.replace(/[+_]+/g, ' '), 96);
    }
    try {
      const u = new URL(item.url);
      return `${u.hostname} · ${this.clampChars(u.pathname.replace(/^\/+/u, '') || u.search.slice(1) || item.url, 80)}`;
    } catch {
      return this.clampChars(item.url, 80);
    }
  }

  detailHint(item: LibraryItemDto): string {
    const lines = [item.url];
    const v = this.primaryVideo(item);
    if (v?.path) lines.push(v.path);
    return lines.join('\n\n');
  }

  copyHint(jobId: string): string {
    return this.copyFlash() === jobId ? 'Copied' : 'Copy file path';
  }

  fileNameOnly(path: string): string {
    const leaf = path.split(/[/\\]/).pop() ?? path;
    return leaf;
  }

  formatBytes(n: number): string {
    if (n <= 0) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB'] as const;
    let i = 0;
    let v = n;
    while (v >= 1024 && i < u.length - 1) {
      v /= 1024;
      i++;
    }
    return `${i === 0 ? v : v.toFixed(1)} ${u[i]}`;
  }

  markPreviewFailed(jobId: string): void {
    this.previewFailed.update((s) => {
      const next = new Set(s);
      next.add(jobId);
      return next;
    });
  }

  openFolder(videoPath: string): void {
    void this.desktop.showItemInFolder(videoPath).catch((e: unknown) =>
      globalThis.alert(e instanceof Error ? e.message : String(e)),
    );
  }

  previewLocal(videoPath: string): void {
    void this.desktop.previewVideo(videoPath).catch((e: unknown) =>
      globalThis.alert(e instanceof Error ? e.message : String(e)),
    );
  }

  async copyPath(jobId: string, path: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(path);
      this.copyFlash.set(jobId);
      globalThis.setTimeout(() => this.copyFlash.update((x) => (x === jobId ? null : x)), 1400);
    } catch {
      globalThis.prompt('Copy path:', path);
    }
  }

  private clampChars(s: string, max: number): string {
    const x = s.trim();
    return x.length <= max ? x : `${x.slice(0, max - 1)}…`;
  }

  async confirmRemove(item: LibraryItemDto): Promise<void> {
    if (
      !globalThis.confirm(
        'Remove this download from Library? Listed files under your downloads folder will be deleted, and history for this job is removed.',
      )
    ) {
      return;
    }

    this.removingJobId.set(item.jobId);
    try {
      await this.api.remove(item.jobId);
      this.previewFailed.update((s) => {
        const next = new Set(s);
        next.delete(item.jobId);
        return next;
      });
      this.items.update((list) => list.filter((i) => i.jobId !== item.jobId));
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.error.set('That download is missing or cannot be removed from Library (completed jobs only).');
      } else if (e instanceof HttpErrorResponse) {
        const detail =
          typeof e.error === 'object' && e.error !== null && 'title' in e.error && typeof e.error.title === 'string'
            ? e.error.title
            : e.message;
        this.error.set(detail.trim() ? detail : `Remove failed (HTTP ${e.status}).`);
      } else if (e instanceof Error) {
        this.error.set(e.message);
      } else {
        this.error.set('Remove failed.');
      }
    } finally {
      this.removingJobId.set(null);
    }
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(undefined);
    this.previewFailed.set(new Set());
    try {
      this.items.set(await this.api.list(200));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load library');
    } finally {
      this.loading.set(false);
    }
  }
}
