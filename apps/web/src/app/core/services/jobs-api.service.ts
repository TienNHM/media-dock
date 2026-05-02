import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { JobDetailDto, JobSummaryDto } from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listJobs(take = 100, status?: string): Promise<JobSummaryDto[]> {
    let params = new HttpParams().set('take', String(take));
    if (status) params = params.set('status', status);
    return firstValueFrom(this.http.get<JobSummaryDto[]>(`${this.base}/api/jobs`, { params }));
  }

  getJob(id: string): Promise<JobDetailDto> {
    return firstValueFrom(this.http.get<JobDetailDto>(`${this.base}/api/jobs/${id}`));
  }

  createJob(url: string, priority = 0, presetId?: string | null): Promise<{ id: string }> {
    return firstValueFrom(
      this.http.post<{ id: string }>(`${this.base}/api/jobs`, { url, priority, presetId: presetId ?? null }),
    );
  }

  createBatchJobs(urls: string[], priority = 0, presetId?: string | null): Promise<{ ids: string[] }> {
    return firstValueFrom(
      this.http.post<{ ids: string[] }>(`${this.base}/api/jobs/batch`, {
        urls,
        priority,
        presetId: presetId ?? null,
      }),
    );
  }

  retryJob(id: string): Promise<{ id: string }> {
    return firstValueFrom(
      this.http.post<{ id: string }>(`${this.base}/api/jobs/${id}/retry`, {}, { observe: 'response' }),
    ).then((res) => {
      const body = res.body;
      if (!body?.id) throw new Error('Retry did not return a job id');
      return body;
    });
  }

  cancelJob(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post(`${this.base}/api/jobs/${id}/cancel`, {}, { responseType: 'text' }),
    ).then(() => undefined);
  }
}
