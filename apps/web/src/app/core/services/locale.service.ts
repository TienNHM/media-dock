import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { syncElectronShellMenu } from '../electron-shell-menu';

export type AppLang = 'en' | 'vi';

const STORAGE_KEY = 'mediadock.lang';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);

  /** Current UI language (after first `TranslateService.use`). */
  readonly lang = signal<AppLang>('en');

  constructor() {
    const cur = this.translate.getCurrentLang();
    if (cur === 'en' || cur === 'vi') {
      this.lang.set(cur);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', cur);
      }
    }
    this.translate.onLangChange.subscribe((e) => {
      const l = e.lang === 'vi' || e.lang === 'en' ? e.lang : 'en';
      this.lang.set(l);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', l);
      }
    });
  }

  use(lang: AppLang): void {
    localStorage.setItem(STORAGE_KEY, lang);
    void firstValueFrom(this.translate.use(lang)).then(() => syncElectronShellMenu(lang));
  }
}
