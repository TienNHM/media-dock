import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import type { JobSummaryDto } from '../models/job.models';
import { JobsApiService } from '../services/jobs-api.service';

interface QueueState {
  jobs: JobSummaryDto[];
  loading: boolean;
  error: string | undefined;
}

const initial: QueueState = { jobs: [], loading: false, error: undefined };

export const QueueStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store) => {
    const api = inject(JobsApiService);
    return {
      async refresh(): Promise<void> {
        patchState(store, { loading: true, error: undefined });
        try {
          const jobs = await api.listJobs(200);
          patchState(store, { jobs, loading: false });
        } catch (e) {
          patchState(store, {
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load queue',
          });
        }
      },
    };
  }),
);
