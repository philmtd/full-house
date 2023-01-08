import {NgModule} from '@angular/core';
import {BrowserModule, DomSanitizer} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GameComponent} from "./game/game/game.component";
import {NewGameComponent} from "./game/new-game/new-game.component";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatInputModule} from "@angular/material/input";
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatOptionModule} from "@angular/material/core";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {Api} from "./game/api/api.service";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {NgxsModule} from "@ngxs/store";
import {environment} from "../environments/environment";
import {NgxsStoragePluginModule} from "@ngxs/storage-plugin";
import {NgxsReduxDevtoolsPluginModule} from "@ngxs/devtools-plugin";
import {NgxsLoggerPluginModule} from "@ngxs/logger-plugin";
import {appStates} from "./store";
import {UserState} from "./store/user/user.state";
import {CreateUserDialogComponent} from "./components/create-user-dialog/create-user-dialog.component";
import {MatDialogModule} from "@angular/material/dialog";
import {ParticipantFilterPipe} from "./game/game/participant-filter.pipe";
import {WebsocketService} from "./game/api/websocket.service";
import {WebsocketApi} from "./game/api/websocket-api.service";
import {NavigationComponent} from "./components/navigation/navigation.component";
import {MatIconModule, MatIconRegistry} from "@angular/material/icon";
import {InvitePlayersDialogComponent} from "./components/invite-players-dialog/invite-players-dialog.component";
import {configureSvgIcons, configureTranslations, provideAnimationDriverBasedOnUserPreferences} from "./configuration/configuration";
import {ParticipantComponent} from "./game/participant/participant.component";
import {AnimationDriver} from "@angular/animations/browser";
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions, MatTooltipModule} from "@angular/material/tooltip";
import {ThemingState} from "./store/theming/theming.state";
import {ThemeSwitcherComponent} from "./components/theme-switcher/theme-switcher.component";
import {MatMenuModule} from "@angular/material/menu";
import {FractionFilterPipe} from "./game/game/fraction-filter.pipe";
import {TranslateCompiler, TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {TranslateMessageFormatCompiler} from "ngx-translate-messageformat-compiler";

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    NewGameComponent,
    CreateUserDialogComponent,
    ParticipantComponent,
    ParticipantFilterPipe,
    NavigationComponent,
    InvitePlayersDialogComponent,
    ThemeSwitcherComponent,
    FractionFilterPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FormsModule,
    HttpClientModule,
    NgxsModule.forRoot(appStates, {developmentMode: !environment.production}),
    NgxsStoragePluginModule.forRoot({key: [UserState, ThemingState]}),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot(),
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompiler
      }
    })
  ],
  providers: [
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
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(iconRegistry: MatIconRegistry,
              domSanitizer: DomSanitizer,
              translate: TranslateService) {
    configureSvgIcons(iconRegistry, domSanitizer);
    configureTranslations(translate);
  }

}
