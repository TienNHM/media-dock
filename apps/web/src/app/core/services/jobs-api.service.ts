import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { JobSummaryDto } from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listJobs(take = 100, status?: string): Promise<JobSummaryDto[]> {
    let params = new HttpParams().set('take', String(take));
    if (status) params = params.set('status', status);
    return firstValueFrom(this.http.get<JobSummaryDto[]>(`${this.base}/api/jobs`, { params }));
  }

  createJob(url: string, priority = 0): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>(`${this.base}/api/jobs`, { url, priority }));
  }
}
