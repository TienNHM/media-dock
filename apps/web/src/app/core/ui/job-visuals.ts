import type { JobStatus } from '@app/core/models/job.models';

type JobIconTone = 'success' | 'danger' | 'warn' | 'info' | 'muted' | 'neutral';

/** PrimeIcons class + semantic tone for standalone colored icons (e.g. tables). */
const jobStatusParts: Record<JobStatus, { icon: string; tone: JobIconTone }> = {
  Draft: { icon: 'pi pi-file-edit', tone: 'muted' },
  Pending: { icon: 'pi pi-hourglass', tone: 'warn' },
  Scheduled: { icon: 'pi pi-calendar', tone: 'info' },
  Queued: { icon: 'pi pi-inbox', tone: 'neutral' },
  Probing: { icon: 'pi pi-search', tone: 'info' },
  Downloading: { icon: 'pi pi-download', tone: 'info' },
  PostProcessing: { icon: 'pi pi-cog', tone: 'info' },
  Paused: { icon: 'pi pi-stop-circle', tone: 'warn' },
  Completed: { icon: 'pi pi-check-circle', tone: 'success' },
  Failed: { icon: 'pi pi-times-circle', tone: 'danger' },
  Retrying: { icon: 'pi pi-sync', tone: 'warn' },
  FailedPermanent: { icon: 'pi pi-times-circle', tone: 'danger' },
  Cancelled: { icon: 'pi pi-ban', tone: 'muted' },
  Interrupted: { icon: 'pi pi-exclamation-triangle', tone: 'danger' },
  NeedsCookies: { icon: 'pi pi-key', tone: 'warn' },
};

/** For `<p-tag [icon]="…">`. */
export function jobStatusPrimeIcon(status: JobStatus): string {
  return jobStatusParts[status]?.icon ?? 'pi pi-question-circle';
}

/** Full class list: icon + `md-job-ico` + tone (use with global `_tokens.scss`). */
export function jobStatusDisplayClasses(status: JobStatus): string {
  const v = jobStatusParts[status] ?? {
    icon: 'pi pi-question-circle',
    tone: 'neutral' as JobIconTone,
  };
  return `${v.icon} md-job-ico md-job-ico--${v.tone}`;
}

export function jobPlatformIconClasses(platform: string): string {
  const p = (platform || 'unknown').toLowerCase();
  if (p.includes('youtube')) return 'pi pi-youtube';
  if (p.includes('facebook')) return 'pi pi-facebook';
  if (p.includes('twitter') || p === 'x') return 'pi pi-twitter';
  if (p.includes('tiktok')) return 'pi pi-tiktok';
  if (p.includes('instagram')) return 'pi pi-instagram';
  if (p.includes('vimeo')) return 'pi pi-vimeo';
  if (p.includes('reddit')) return 'pi pi-reddit';
  return 'pi pi-globe';
}

/** Artifact rows (job detail table). */
export function artifactKindIcon(kind: string): string {
  const k = kind.toLowerCase();
  if (k === 'video') return 'pi pi-video';
  if (k === 'audio') return 'pi pi-volume-up';
  if (k === 'thumbnail') return 'pi pi-image';
  if (k === 'subtitle') return 'pi pi-align-left';
  return 'pi pi-file';
}
