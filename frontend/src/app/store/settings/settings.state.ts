import {Action, Selector, State, StateContext} from '@ngxs/store';
import {inject, Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

export type AppLanguage = 'de' | 'en';

export interface SettingsStateModel {
  inviteQrCodeVisible: boolean;
  language: AppLanguage | undefined;
}

const defaultState: SettingsStateModel = {
  inviteQrCodeVisible: false,
  language: undefined
};

export class ToggleQrCodeVisibility {
  static readonly type = '[Settings] Toggle QR code visibility';

}

export class SetLanguage {
  static readonly type = '[Settings] Set Language';

  constructor(public language: AppLanguage) {
  }
}

@State({
  name: 'ppSettings',
  defaults: defaultState
})
@Injectable()
export class SettingsState {
  private translate = inject(TranslateService);

  @Selector()
  static isInviteQrCodeVisible(state: SettingsStateModel): boolean {
    return state.inviteQrCodeVisible;
  }

  @Selector()
  static language(state: SettingsStateModel): AppLanguage | undefined {
    return state.language;
  }

  @Action(ToggleQrCodeVisibility)
  toggleQrCodeVisibility(ctx: StateContext<SettingsStateModel>) {
    ctx.patchState({
      inviteQrCodeVisible: !ctx.getState().inviteQrCodeVisible
    });
  }

  @Action(SetLanguage)
  setLanguage(ctx: StateContext<SettingsStateModel>, action: SetLanguage) {
    ctx.patchState({
      language: action.language
    });
    this.translate.use(action.language);
  }

}
