import {Component} from "@angular/core";
import {SetThemeMode, ThemingMode, ThemingState} from "../../store/theming/theming.state";
import {Select, Store} from "@ngxs/store";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'pp-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss']
})
export class ThemeSwitcherComponent {

  modes: Array<{ label: Observable<string>, mode: ThemingMode, icon: string }>;

  @Select(ThemingState.themingMode) themingMode$: Observable<ThemingMode>;
  @Select(ThemingState.isDarkMode) isDarkMode$: Observable<boolean>;
  currentModeIcon: Observable<string>;

  constructor(private store: Store, translate: TranslateService) {
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
