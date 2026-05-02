import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { ScheduleDto } from '../models/job.models';

@Injectable({ providedIn: 'root' })
export class SchedulesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Promise<ScheduleDto[]> {
    return firstValueFrom(this.http.get<ScheduleDto[]>(`${this.base}/api/schedules`));
  }

  create(body: { cron: string; timezone: string; jobTemplateJson: string; enabled?: boolean }): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>(`${this.base}/api/schedules`, body));
  }

  update(
    id: string,
    body: { cron: string; timezone: string; jobTemplateJson: string; enabled: boolean },
  ): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/api/schedules/${id}`, body));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/api/schedules/${id}`));
  }
}
