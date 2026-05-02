import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DesktopBridgeService {
  isDesktopShell(): boolean {
    return typeof globalThis.window !== 'undefined' && !!window.mediadock?.showItemInFolder;
  }

  async showItemInFolder(fullPath: string): Promise<void> {
    const fn = window.mediadock?.showItemInFolder;
    if (!fn) throw new Error('Chỉ khả dụng trong ứng dụng desktop MediaDock.');
    await fn(fullPath);
  }

  async previewVideo(fullPath: string): Promise<void> {
    const fn = window.mediadock?.previewVideo;
    if (!fn) throw new Error('Chỉ khả dụng trong ứng dụng desktop MediaDock.');
    await fn(fullPath);
  }
}
