import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const w = globalThis as unknown as { __MEDIADOCK__?: { apiBaseUrl?: string } };
    return w.__MEDIADOCK__?.apiBaseUrl ?? 'http://127.0.0.1:17888';
  },
});
