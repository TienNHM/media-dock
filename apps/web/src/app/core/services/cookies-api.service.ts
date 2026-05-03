import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '@app/core/config/api.config';
import type { CookieProfileDto } from '@app/core/models/job.models';

@Injectable({ providedIn: 'root' })
export class CookiesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Promise<CookieProfileDto[]> {
    return firstValueFrom(this.http.get<CookieProfileDto[]>(`${this.base}/api/cookies/profiles`));
  }

  save(profiles: { id?: string | null; name: string; filePath: string; createdAt?: string | null }[]): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/api/cookies/profiles`, profiles));
  }
}
