import {Action, NgxsOnInit, Selector, State, StateContext, Store} from '@ngxs/store';
import {Injectable} from '@angular/core';
import {filter, first} from 'rxjs/operators';

export type ThemingMode = 'light' | 'dark' | 'auto';
type Theme = 'dark' | 'light';

export interface ThemingStateModel {
  darkMode: boolean;
  mode: ThemingMode;
}

const defaultState: ThemingStateModel = {
  darkMode: false,
  mode: 'auto'
};

export class SetTheme {
  static readonly type = '[Theming] Set Theme';

  constructor(public darkTheme: boolean) {
  }
}

export class SetThemeMode {
  static readonly type = '[Theming] Set Theme Mode';

  constructor(public themeMode: ThemingMode) {
  }
}

@State({
  name: 'ppTheming',
  defaults: defaultState
})
@Injectable()
export class ThemingState implements NgxsOnInit {

  constructor(private store: Store) {
    this.registerThemePreferenceListeners();
  }

  @Selector()
  static isDarkMode(state: ThemingStateModel): boolean {
    return state.darkMode;
  }

  @Selector()
  static themingMode(state: ThemingStateModel): ThemingMode {
    return state.mode;
  }

  ngxsOnInit(ctx: StateContext<ThemingStateModel>): void | any {
    const mode = ctx.getState().mode;
    if (mode === 'auto') {
      const isDark = this.getCurrentThemeFromMediaQueryPreferences() === 'dark';
      ctx.patchState({
        darkMode: isDark
      });
    }
  }


  @Action(SetThemeMode)
  setThemeMode(ctx: StateContext<ThemingStateModel>, action: SetThemeMode) {
    if (action.themeMode === 'auto') {
      ctx.patchState({
        mode: 'auto',
        darkMode: this.getCurrentThemeFromMediaQueryPreferences() === 'dark'
      });
    } else if (action.themeMode === 'dark') {
      ctx.patchState({
        mode: 'dark',
        darkMode: true
      });
    } else {
      ctx.patchState({
        mode: 'light',
        darkMode: false
      });
    }
  }

  @Action(SetTheme)
  setTheme(ctx: StateContext<ThemingStateModel>, action: SetTheme) {
    const state = ctx.getState();
    if (state.mode === 'light' && action.darkTheme) {
      return;
    }
    if (state.mode === 'dark' && !action.darkTheme) {
      return;
    }
    ctx.patchState({
      darkMode: action.darkTheme
    });
  }

  private registerThemePreferenceListeners() {
    const darkEventListener = (e: MediaQueryListEvent) => {
      this.store.select(ThemingState.themingMode).pipe(filter(m => !!m), first()).subscribe(mode => {
        if (e.matches && mode === 'auto') {
          this.store.dispatch(new SetTheme(true));
        }
      });
    };
    const lightEventListener = (e: MediaQueryListEvent) => {
      this.store.select(ThemingState.themingMode).pipe(filter(m => !!m), first()).subscribe(mode => {
        if (e.matches && mode === 'auto') {
          this.store.dispatch(new SetTheme(false));
        }
      });
    };

    // use deprecated addListener because Safari does not support addEventListener:
    window.matchMedia('(prefers-color-scheme: dark)').addListener(darkEventListener); // tslint:disable-line
    window.matchMedia('(prefers-color-scheme: light)').addListener(lightEventListener); // tslint:disable-line
  }

  private getCurrentThemeFromMediaQueryPreferences(): Theme {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDarkMode ? 'dark' : 'light';
  }
}
