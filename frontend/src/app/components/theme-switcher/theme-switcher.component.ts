import { Component, inject, computed } from "@angular/core";
import {SetThemeMode, ThemingMode, ThemingState} from "../../store/theming/theming.state";
import {Store} from "@ngxs/store";
import {Observable} from "rxjs";
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
  private translate = inject(TranslateService);

  modes: Array<{ label: Observable<string>, mode: ThemingMode, icon: string }>;

  themingMode = this.store.selectSignal(ThemingState.themingMode);
  isDarkMode = this.store.selectSignal(ThemingState.isDarkMode);
  currentModeIcon = computed(() => {
    const isDark = this.isDarkMode();
    const mode = isDark ? 'dark' : 'light';
    return this.modes.find(m => m.mode === mode)?.icon ?? 'settings-brightness';
  });

  constructor() {
    this.modes = [
      {
        label: this.translate.get('components.themeSwitcher.auto'),
        mode: 'auto',
        icon: 'settings-brightness'
      }, {
        label: this.translate.get('components.themeSwitcher.light'),
        mode: 'light',
        icon: 'light-mode'
      }, {
        label: this.translate.get('components.themeSwitcher.dark'),
        mode: 'dark',
        icon: 'dark-mode'
      }
    ];
  }

  setMode(mode: ThemingMode) {
    this.store.dispatch(new SetThemeMode(mode));
  }
}
