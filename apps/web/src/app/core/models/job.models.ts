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
  lastErrorMessage?: string | null;
}
