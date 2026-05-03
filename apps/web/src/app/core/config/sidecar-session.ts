const defaultApiBase = 'http://127.0.0.1:17888';

/** Session values that may be filled by APP_INITIALIZER (Electron) before the first API call. */
export const sidecarSession = {
  apiBaseUrl: defaultApiBase,
  /** From sidecar-runtime.json via Electron IPC; empty in plain browser. */
  authTokenFromBridge: '',
};

export async function hydrateSidecarSessionFromElectron(): Promise<void> {
  const bridge = typeof window !== 'undefined' ? window.mediadock?.getSidecarRuntime : undefined;
  if (typeof bridge !== 'function') return;
  try {
    const j = await bridge();
    if (j?.apiBaseUrl?.trim()) {
      sidecarSession.apiBaseUrl = j.apiBaseUrl.trim().replace(/\/+$/, '');
    } else if (typeof j.port === 'number') {
      sidecarSession.apiBaseUrl = `http://127.0.0.1:${j.port}`;
    }
    sidecarSession.authTokenFromBridge = (j.authToken ?? '').trim();
  } catch {
    /* preload / file missing until API is up — keep defaults */
  }
}
