export {};

declare global {
  interface Window {
    mediadock?: {
      platform?: string;
      openExternal?: (url: string) => Promise<void>;
      showItemInFolder?: (fullPath: string) => Promise<void>;
      previewVideo?: (fullPath: string) => Promise<void>;
      setMenuLocale?: (lang: 'en' | 'vi') => Promise<void>;
    };
  }
}
