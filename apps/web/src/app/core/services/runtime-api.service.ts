import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface DownloadsInfoDto {
  downloadsRoot: string;
  configuredRootPath: string | null;
  databaseRootPath: string | null;
  source: string;
}

@Injectable({ providedIn: 'root' })
export class RuntimeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getDownloadsInfo(): Promise<DownloadsInfoDto> {
    return firstValueFrom(this.http.get<DownloadsInfoDto>(`${this.base}/api/runtime/downloads`));
  }

  setDownloadsPath(path: string | null): Promise<void> {
    return firstValueFrom(
      this.http.put(`${this.base}/api/runtime/downloads`, { path: path ?? '' }, { responseType: 'text' }),
    ).then(() => undefined);
  }
}
