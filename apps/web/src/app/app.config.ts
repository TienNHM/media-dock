import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { syncElectronShellMenu } from './core/electron-shell-menu';
import { routes } from './app.routes';

function initTranslations(translate: TranslateService) {
  return () => {
    translate.addLangs(['en', 'vi']);
    translate.setFallbackLang('en');
    const saved = localStorage.getItem('mediadock.lang');
    const browser = translate.getBrowserLang()?.toLowerCase() ?? '';
    const lang =
      saved === 'en' || saved === 'vi' ? saved : browser.startsWith('vi') ? 'vi' : 'en';
    return firstValueFrom(translate.use(lang)).then(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', lang);
      }
      syncElectronShellMenu(lang);
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark, [data-theme="dark"]',
        },
      },
    }),
    ...provideTranslateService({ fallbackLang: 'en' }),
    ...provideTranslateHttpLoader({
      prefix: '/i18n/',
      suffix: '.json',
    }),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TranslateService],
      useFactory: initTranslations,
    },
  ],
};
