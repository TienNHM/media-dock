export type JobStatus =
  | 'Draft'
  | 'Pending'
  | 'Scheduled'
  | 'Queued'
  | 'Probing'
  | 'Downloading'
  | 'PostProcessing'
  | 'Paused'
  | 'Completed'
  | 'Failed'
  | 'Retrying'
  | 'FailedPermanent'
  | 'Cancelled'
  | 'Interrupted'
  | 'NeedsCookies';

export interface JobSummaryDto {
  id: string;
  url: string;
  sourcePlatform: string;
  status: JobStatus;
  priority: number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastErrorMessage?: string | null;
}

export interface JobArtifactDto {
  id: string;
  kind: string;
  path: string;
  sizeBytes?: number | null;
  mimeType?: string | null;
}

export interface JobDetailDto {
  id: string;
  url: string;
  sourcePlatform: string;
  status: JobStatus;
  priority: number;
  presetId?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastErrorMessage?: string | null;
  specJson: string;
  progress?: {
    phase: string;
    percent?: number | null;
    bytesDone?: number | null;
    bytesTotal?: number | null;
    updatedAt: string;
  } | null;
  artifacts: JobArtifactDto[];
}

export interface PresetDto {
  id: string;
  name: string;
  description?: string | null;
  specJson: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDto {
  id: string;
  cron: string;
  timezone: string;
  jobTemplateJson: string;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  enabled: boolean;
}

export interface CookieProfileDto {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
}

export interface LibraryItemDto {
  jobId: string;
  url: string;
  sourcePlatform: string;
  completedAt: string;
  files: { id: string; kind: string; path: string; sizeBytes?: number | null }[];
}
