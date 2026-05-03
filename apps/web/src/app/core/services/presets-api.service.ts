import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '@app/core/config/api.config';
import type { PresetDto } from '@app/core/models/job.models';

@Injectable({ providedIn: 'root' })
export class PresetsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Promise<PresetDto[]> {
    return firstValueFrom(this.http.get<PresetDto[]>(`${this.base}/api/presets`));
  }

  create(body: { name: string; description?: string | null; specJson: string; isDefault?: boolean }): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>(`${this.base}/api/presets`, body));
  }

  update(
    id: string,
    body: { name: string; description?: string | null; specJson: string; isDefault: boolean },
  ): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/api/presets/${id}`, body));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/api/presets/${id}`));
  }
}
