import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import type { CookieProfileDto } from '../../core/models/job.models';
import { CookiesApiService } from '../../core/services/cookies-api.service';

@Component({
  standalone: true,
  selector: 'app-cookies-page',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Cookie files</h1>
        <div class="actions">
          <button pButton type="button" label="Add row" class="p-button-text" (click)="addRow()"></button>
          <button pButton type="button" label="Save" (click)="save()" [disabled]="busy()"></button>
        </div>
      </div>
      <p class="muted">Đường dẫn tuyệt đối tới file cookies (Netscape) dùng trong preset JSON: <span class="mono">cookiesPath</span>.</p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <p-table [value]="rows()" [tableStyle]="{ 'min-width': '52rem' }">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>File path</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row let-i="rowIndex">
          <tr>
            <td><input pInputText [(ngModel)]="row.name" class="w-full" /></td>
            <td><input pInputText [(ngModel)]="row.filePath" class="w-full mono" /></td>
            <td>
              <button pButton type="button" class="p-button-text p-button-danger" label="Remove" (click)="removeAt(i)"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .page__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .muted {
        color: var(--md-text-muted);
      }
      .err {
        color: #f87171;
      }
      .mono {
        font-family: ui-monospace, monospace;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class CookiesPage implements OnInit {
  private readonly api = inject(CookiesApiService);

  readonly rows = signal<{ id?: string; name: string; filePath: string; createdAt?: string }[]>([]);
  readonly error = signal<string | undefined>(undefined);
  readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(undefined);
    try {
      const list = await this.api.list();
      this.rows.set(list.map((c: CookieProfileDto) => ({ id: c.id, name: c.name, filePath: c.filePath, createdAt: c.createdAt })));
      if (this.rows().length === 0) this.rows.set([{ name: '', filePath: '' }]);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load');
      this.rows.set([{ name: '', filePath: '' }]);
    }
  }

  addRow(): void {
    this.rows.update((r) => [...r, { name: '', filePath: '' }]);
  }

  removeAt(i: number): void {
    this.rows.update((r) => r.filter((_, j) => j !== i));
    if (this.rows().length === 0) this.rows.set([{ name: '', filePath: '' }]);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const payload = this.rows()
        .filter((x) => x.name.trim() && x.filePath.trim())
        .map((x) => ({
          id: x.id ?? null,
          name: x.name.trim(),
          filePath: x.filePath.trim(),
          createdAt: x.createdAt ?? null,
        }));
      await this.api.save(payload);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Save failed');
    } finally {
      this.busy.set(false);
    }
  }
}
