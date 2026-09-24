import {ChangeDetectionStrategy, Component, computed, inject, signal} from "@angular/core";
import {SetThemeMode, ThemingMode, ThemingState} from "../../store/theming/theming.state";
import {Store} from "@ngxs/store";
import {TranslatePipe} from "@ngx-translate/core";
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";

interface ModeModel {
  label: string,
  mode: ThemingMode,
  icon: string
}

@Component({
  selector: 'pp-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  imports: [
    MatIconButton,
    MatIcon,
    TranslatePipe,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class ThemeSwitcherComponent {
  private store = inject(Store);

  readonly modes = signal<Array<ModeModel>>([
    {
      label: 'components.themeSwitcher.auto',
      mode: 'auto',
      icon: 'settings-brightness'
    }, {
      label: 'components.themeSwitcher.light',
      mode: 'light',
      icon: 'light-mode'
    }, {
      label: 'components.themeSwitcher.dark',
      mode: 'dark',
      icon: 'dark-mode'
    }
  ]);

  readonly themingMode = this.store.selectSignal(ThemingState.themingMode);
  readonly isDarkMode = this.store.selectSignal(ThemingState.isDarkMode);
  readonly currentModeIcon = computed(() => {
    const isDark = this.isDarkMode();
    const mode: ThemingMode = isDark ? 'dark' : 'light';
    return this.modes().find(m => m.mode === mode)?.icon ?? 'settings-brightness';
  });

  setMode(mode: ThemingMode) {
    this.store.dispatch(new SetThemeMode(mode));
  }
}
