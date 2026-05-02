import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface NotificationDto {
  id: string;
  /** Present for job lifecycle notifications from the processor. */
  jobId?: string | null;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(take = 50): Promise<NotificationDto[]> {
    const params = new HttpParams().set('take', String(take));
    return firstValueFrom(this.http.get<NotificationDto[]>(`${this.base}/api/notifications`, { params }));
  }

  unreadCount(): Promise<number> {
    return firstValueFrom(
      this.http.get<{ count: number }>(`${this.base}/api/notifications/unread-count`),
    ).then((r) => r.count);
  }

  markRead(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post(`${this.base}/api/notifications/${id}/read`, {}, { responseType: 'text' }),
    ).then(() => undefined);
  }

  markAllRead(): Promise<void> {
    return firstValueFrom(
      this.http.post(`${this.base}/api/notifications/read-all`, {}, { responseType: 'text' }),
    ).then(() => undefined);
  }
}
