import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {AnimationDriver, NoopAnimationDriver, ɵWebAnimationsDriver as WebAnimationsDriver} from '@angular/animations/browser';
import {TranslateService} from "@ngx-translate/core";
import LAN_EN from './../i18n/en.json';

export const configureSvgIcons = (iconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) => {
  iconRegistry.addSvgIconResolver((name, namespace) => {
    let iconUrl: string | undefined;
    if (namespace === '') {
      iconUrl = `assets/icons/two-tone/${name}.svg`;
    }
    return iconUrl ? domSanitizer.bypassSecurityTrustResourceUrl(iconUrl) : null;
  });
};

export const provideAnimationDriverBasedOnUserPreferences = (): AnimationDriver => {
  const noop = new NoopAnimationDriver();
  const driver = new WebAnimationsDriver();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion ? noop : driver;
};

export const configureTranslations = (translate: TranslateService) => {
  translate.setTranslation('en', LAN_EN, false);
  translate.setDefaultLang('en');
  translate.use('en');
};
