export {};

declare global {
  interface Window {
    mediadock?: {
      platform?: string;
      openExternal?: (url: string) => Promise<void>;
      showItemInFolder?: (fullPath: string) => Promise<void>;
      previewVideo?: (fullPath: string) => Promise<void>;
      setMenuLocale?: (lang: 'en' | 'vi') => Promise<void>;
      /** Electron main reads sidecar-runtime.json (same paths as MediaDock.Api). */
      getSidecarRuntime?: () => Promise<{
        port?: number;
        apiBaseUrl?: string;
        authToken?: string;
      }>;
    };
  }
}
