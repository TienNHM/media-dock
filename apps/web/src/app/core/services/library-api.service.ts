import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { LibraryItemDto } from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class LibraryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(take = 100): Promise<LibraryItemDto[]> {
    const params = new HttpParams().set('take', String(take));
    return firstValueFrom(this.http.get<LibraryItemDto[]>(`${this.base}/api/library`, { params }));
  }

  /** Absolute API URL to stream an artifact (Range requests supported for video seeking). */
  previewUrl(jobId: string, artifactId: string): string {
    return `${this.base}/api/library/${jobId}/artifacts/${artifactId}/preview`;
  }

  /** Deletes artifact files under the downloads root and removes the completed job record. */
  remove(jobId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/api/library/${jobId}`));
  }
}
