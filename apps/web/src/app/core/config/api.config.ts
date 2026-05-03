import { InjectionToken } from '@angular/core';
import { sidecarSession } from '@app/core/config/sidecar-session';

/** Browser-only override when not using Electron; copy `authToken` from sidecar-runtime.json if needed. */
export const MEDIADOCK_SIDECAR_TOKEN_LS_KEY = 'mediadock.sidecarToken';

/**
 * Secret sent as X-MediaDock-Token. Order: Electron bridge → localStorage → legacy __MEDIADOCK__ global.
 * No header is added when this is empty and the API allows anonymous access (typical Development).
 */
export function getSidecarAuthToken(): string {
  const bridged = sidecarSession.authTokenFromBridge.trim();
  if (bridged) return bridged;

  try {
    const w = globalThis as unknown as { __MEDIADOCK__?: { authToken?: string } };
    const g = w.__MEDIADOCK__?.authToken;
    if (typeof g === 'string' && g.trim()) return g.trim();
  } catch {
    /* ignore */
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(MEDIADOCK_SIDECAR_TOKEN_LS_KEY);
      if (v?.trim()) return v.trim();
    }
  } catch {
    /* private mode */
  }

  return '';
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const w = globalThis as unknown as { __MEDIADOCK__?: { apiBaseUrl?: string } };
    return w.__MEDIADOCK__?.apiBaseUrl?.trim() || sidecarSession.apiBaseUrl;
  },
});
