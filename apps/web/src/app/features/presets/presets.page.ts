import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import type { PresetDto } from '../../core/models/job.models';
import { PresetsApiService } from '../../core/services/presets-api.service';

@Component({
  standalone: true,
  selector: 'app-presets-page',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, Textarea],
  template: `
    <div class="page">
      <div class="page__header">
        <h1>Presets</h1>
        <button pButton type="button" label="New preset" (click)="openCreate()"></button>
      </div>
      <p class="muted">JSON spec: format (yt-dlp -f), subs, thumb, optional cookiesPath (absolute file).</p>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }

      <p-table [value]="presets()" [tableStyle]="{ 'min-width': '48rem' }">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Default</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td>{{ p.name }}</td>
            <td>{{ p.isDefault ? 'Yes' : '' }}</td>
            <td class="mono">{{ p.updatedAt | date: 'short' }}</td>
            <td class="actions">
              <button pButton type="button" class="p-button-text" label="Edit" (click)="openEdit(p)"></button>
              <button pButton type="button" class="p-button-text p-button-danger" label="Delete" (click)="remove(p)"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [header]="editingId() ? 'Edit preset' : 'New preset'"
      [visible]="dialogOpen()"
      (visibleChange)="dialogOpen.set($event)"
      [modal]="true"
      [style]="{ width: 'min(640px, 94vw)' }"
    >
      <div class="form">
        <label>Name</label>
        <input pInputText [(ngModel)]="formName" class="w-full" />
        <label>Description</label>
        <input pInputText [(ngModel)]="formDescription" class="w-full" />
        <label>Spec JSON</label>
        <textarea pTextarea [(ngModel)]="formSpec" rows="8" class="w-full mono"></textarea>
        <label class="row-check"><input type="checkbox" [(ngModel)]="formDefault" /> Default preset</label>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancel" class="p-button-text" (click)="dialogOpen.set(false)"></button>
        <button pButton type="button" label="Save" (click)="save()" [disabled]="busy() || !formName.trim()"></button>
      </ng-template>
    </p-dialog>
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
      .actions {
        white-space: nowrap;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .form label {
        font-size: 0.85rem;
        margin-top: 4px;
      }
      .row-check {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mono {
        font-family: ui-monospace, monospace;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class PresetsPage implements OnInit {
  private readonly api = inject(PresetsApiService);

  readonly presets = signal<PresetDto[]>([]);
  readonly error = signal<string | undefined>(undefined);
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly busy = signal(false);

  formName = '';
  formDescription = '';
  formSpec = '{"format":"bv*+ba/b","subs":false,"thumb":false}';
  formDefault = false;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(undefined);
    try {
      this.presets.set(await this.api.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load presets');
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formSpec = '{"format":"bv*+ba/b","subs":false,"thumb":false}';
    this.formDefault = false;
    this.dialogOpen.set(true);
  }

  openEdit(p: PresetDto): void {
    this.editingId.set(p.id);
    this.formName = p.name;
    this.formDescription = p.description ?? '';
    this.formSpec = p.specJson;
    this.formDefault = p.isDefault;
    this.dialogOpen.set(true);
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const id = this.editingId();
      if (id)
        await this.api.update(id, {
          name: this.formName,
          description: this.formDescription || null,
          specJson: this.formSpec,
          isDefault: this.formDefault,
        });
      else
        await this.api.create({
          name: this.formName,
          description: this.formDescription || null,
          specJson: this.formSpec,
          isDefault: this.formDefault,
        });
      this.dialogOpen.set(false);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Save failed');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(p: PresetDto): Promise<void> {
    if (!globalThis.confirm(`Delete preset "${p.name}"?`)) return;
    try {
      await this.api.delete(p.id);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Delete failed');
    }
  }
}
