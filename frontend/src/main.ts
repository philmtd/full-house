import {enableProdMode, importProvidersFrom} from '@angular/core';
import {environment} from './environments/environment';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions, MatTooltipModule} from '@angular/material/tooltip';
import {Api} from './app/game/api/api.service';
import {WebsocketService} from './app/game/api/websocket.service';
import {WebsocketApi} from './app/game/api/websocket-api.service';
import {AnimationDriver} from '@angular/animations/browser';
import {configureSvgIcons, configureTranslations, provideAnimationDriverBasedOnUserPreferences} from './app/configuration/configuration';
import {provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {bootstrapApplication, DomSanitizer} from '@angular/platform-browser';
import {AppRoutingModule} from './app/app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {provideStore} from '@ngxs/store';
import {appStates} from './app/store';
import {MatIconModule, MatIconRegistry} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {provideTranslateCompiler, provideTranslateService, TranslateService} from '@ngx-translate/core';
import {TranslateMessageFormatCompiler} from 'ngx-translate-messageformat-compiler';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AppComponent} from './app/app.component';
import {withNgxsStoragePlugin} from "@ngxs/storage-plugin";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(AppRoutingModule, BrowserAnimationsModule, MatDialogModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, FormsModule, MatIconModule, MatMenuModule, MatTooltipModule), MatProgressSpinnerModule,
    provideStore(appStates, {developmentMode: !environment.production, ...withNgxsStoragePlugin({
        keys: '*'
      })}),
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}},
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: <MatTooltipDefaultOptions>{
        showDelay: 500
      }
    },
    Api,
    WebsocketService,
    WebsocketApi,
    {
      provide: AnimationDriver,
      useFactory: () => provideAnimationDriverBasedOnUserPreferences()
    },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideTranslateService({
      compiler: provideTranslateCompiler(TranslateMessageFormatCompiler)
    }),
  ]
}).then(app => {
  const iconRegistry = app.injector.get(MatIconRegistry);
  const domSanitizer = app.injector.get(DomSanitizer);
  const translate = app.injector.get(TranslateService);
  configureSvgIcons(iconRegistry, domSanitizer);
  configureTranslations(translate);
}).catch(err => console.error(err));
