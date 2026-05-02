import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import type { LibraryItemDto } from '../../core/models/job.models';
import { LibraryApiService } from '../../core/services/library-api.service';

@Component({
  standalone: true,
  selector: 'app-library-page',
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Library</h1>
        <button pButton type="button" label="Refresh" (click)="load()"></button>
      </div>
      <p class="muted">Completed jobs and files on disk (from database).</p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <div class="grid">
        @for (item of items(); track item.jobId) {
          <p-card [header]="item.sourcePlatform + ' · ' + (item.completedAt | date: 'medium')">
            <p class="url mono">{{ item.url }}</p>
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
      .err {
        color: #f87171;
      }
      .grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 12px;
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
  private readonly api = inject(LibraryApiService);

  readonly items = signal<LibraryItemDto[]>([]);
  readonly error = signal<string | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    await this.load();
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
