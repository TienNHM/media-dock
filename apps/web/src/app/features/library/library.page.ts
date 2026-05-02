import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import type { LibraryItemDto } from '../../core/models/job.models';
import { LibraryApiService } from '../../core/services/library-api.service';

@Component({
  standalone: true,
  selector: 'app-library-page',
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Library</h1>
        <button pButton type="button" label="Refresh" (click)="load()"></button>
      </div>
      <p class="muted">Đã hoàn thành — xem trước video qua API (HTTP range).</p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <div class="grid">
        @for (item of items(); track item.jobId) {
          <p-card [header]="item.sourcePlatform + ' · ' + (item.completedAt | date: 'medium')">
            @if (primaryVideo(item); as vid) {
              <div class="preview-wrap">
                <video
                  class="preview"
                  controls
                  preload="metadata"
                  playsinline
                  [attr.poster]="posterUrl(item) ?? null"
                  [src]="api.previewUrl(item.jobId, vid.id)"
                ></video>
              </div>
            } @else {
              @if (primaryThumbnail(item); as th) {
                <div class="preview-wrap">
                  <img
                    class="preview preview--img"
                    [src]="api.previewUrl(item.jobId, th.id)"
                    alt=""
                  />
                </div>
              } @else {
                @if (primaryAudio(item); as au) {
                  <div class="preview-wrap preview-wrap--audio">
                    <audio controls preload="metadata" [src]="api.previewUrl(item.jobId, au.id)"></audio>
                  </div>
                }
              }
            }

            <p class="url mono">{{ item.url }}</p>
            <p class="job-link muted">
              <a [routerLink]="['/jobs', item.jobId]">Job details</a>
            </p>
            <ul class="files">
              @for (f of item.files; track f.id) {
                <li>
                  <span class="kind">{{ f.kind }}</span>
                  <span class="path mono">{{ f.path }}</span>
                  @if (f.sizeBytes != null) {
                    <span class="size">({{ f.sizeBytes | number }} B)</span>
                  }
                </li>
              }
            </ul>
          </p-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      h1 {
        margin: 0;
      }
      .muted {
        color: var(--md-text-muted);
      }
      .job-link {
        margin: 0 0 8px;
        font-size: 0.85rem;
      }
      .job-link a {
        color: var(--p-primary-color, #8ab4ff);
        text-decoration: none;
      }
      .job-link a:hover {
        text-decoration: underline;
      }
      .err {
        color: #f87171;
      }
      .grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 12px;
      }
      .preview-wrap {
        margin: -8px -4px 12px;
        border-radius: 8px;
        overflow: hidden;
        background: #0b0c0e;
        aspect-ratio: 16 / 9;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .preview-wrap--audio {
        aspect-ratio: auto;
        padding: 12px;
      }
      .preview {
        width: 100%;
        max-height: 220px;
        vertical-align: middle;
        object-fit: contain;
      }
      .preview--img {
        max-height: 220px;
        object-fit: cover;
      }
      .url {
        font-size: 0.85rem;
        word-break: break-all;
        margin: 0 0 8px;
      }
      .files {
        margin: 0;
        padding-left: 1.1rem;
        font-size: 0.85rem;
      }
      .kind {
        color: var(--md-text-muted);
        margin-right: 6px;
      }
      .path {
        word-break: break-all;
      }
      .size {
        color: var(--md-text-muted);
        margin-left: 4px;
      }
    `,
  ],
})
export class LibraryPage implements OnInit {
  readonly api = inject(LibraryApiService);

  readonly items = signal<LibraryItemDto[]>([]);
  readonly error = signal<string | undefined>(undefined);

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

  async load(): Promise<void> {
    this.error.set(undefined);
    try {
      this.items.set(await this.api.list(200));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load library');
    }
  }
}
