/** Syncs Electron main-process menu locale (outside Angular i18n). */
export function syncElectronShellMenu(lang: 'en' | 'vi'): void {
  try {
    if (typeof window === 'undefined') return;
    void window.mediadock?.setMenuLocale?.(lang);
  } catch {
    /* dev in browser-only */
  }
}
