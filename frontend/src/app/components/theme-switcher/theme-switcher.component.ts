import { Component, inject } from "@angular/core";
import {SetThemeMode, ThemingMode, ThemingState} from "../../store/theming/theming.state";
import {Select, Store} from "@ngxs/store";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {TranslateService} from "@ngx-translate/core";
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {AsyncPipe} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";

@Component({
  selector: 'pp-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  imports: [
    MatIconButton,
    MatIcon,
    AsyncPipe,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  standalone: true
})
export class ThemeSwitcherComponent {
  private store = inject(Store);


  modes: Array<{ label: Observable<string>, mode: ThemingMode, icon: string }>;

  @Select(ThemingState.themingMode) themingMode$: Observable<ThemingMode>;
  @Select(ThemingState.isDarkMode) isDarkMode$: Observable<boolean>;
  currentModeIcon: Observable<string>;

  constructor() {
    const translate = inject(TranslateService);

    this.currentModeIcon = this.isDarkMode$.pipe(
      map(isDarkMode => isDarkMode ? 'dark' : 'light'),
      map(mode => this.modes.find(m => m.mode === mode)!.icon!))
    this.modes = [
      {
        label: translate.get('components.themeSwitcher.auto'),
        mode: 'auto',
        icon: 'settings-brightness'
      }, {
        label: translate.get('components.themeSwitcher.light'),
        mode: 'light',
        icon: 'light-mode'
      }, {
        label: translate.get('components.themeSwitcher.dark'),
        mode: 'dark',
        icon: 'dark-mode'
      }
    ];
  }

  setMode(mode: ThemingMode) {
    this.store.dispatch(new SetThemeMode(mode));
  }
}
