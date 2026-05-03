import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL, getSidecarAuthToken } from '@app/core/config/api.config';

export interface JobProgressDto {
  jobId: string;
  phase: string;
  percent?: number | null;
  bytesDone?: number | null;
  bytesTotal?: number | null;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class JobsRealtimeService {
  private readonly base = inject(API_BASE_URL);
  private hub?: HubConnection;

  readonly lastProgress = signal<JobProgressDto | null>(null);
  readonly connectionState = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');

  async start(): Promise<void> {
    if (this.hub) return;

    this.connectionState.set('connecting');
    const token = getSidecarAuthToken();
    this.hub = new HubConnectionBuilder()
      .withUrl(`${this.base}/hubs/jobs`, {
        withCredentials: false,
        ...(token ? { headers: { 'X-MediaDock-Token': token } } : {}),
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    this.hub.on('jobProgress', (payload: JobProgressDto) => this.lastProgress.set(payload));

    this.hub.onreconnecting(() => this.connectionState.set('connecting'));
    this.hub.onreconnected(() => this.connectionState.set('connected'));
    this.hub.onclose(() => this.connectionState.set('disconnected'));

    await this.hub.start();
    this.connectionState.set('connected');
  }

  async stop(): Promise<void> {
    if (!this.hub) return;
    await this.hub.stop();
    this.hub = undefined;
    this.connectionState.set('disconnected');
  }
}
