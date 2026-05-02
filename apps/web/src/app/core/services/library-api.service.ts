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
}
