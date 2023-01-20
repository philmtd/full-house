import {Action, NgxsOnInit, Selector, State, StateContext, Store} from '@ngxs/store';
import {Injectable} from '@angular/core';
import {filter, first} from 'rxjs/operators';

export interface SettingsStateModel {
  inviteQrCodeVisible: boolean;
}

const defaultState: SettingsStateModel = {
  inviteQrCodeVisible: false
};

export class ToggleQrCodeVisibility {
  static readonly type = '[Settings] Toggle QR code visibility';

}

@State({
  name: 'ppSettings',
  defaults: defaultState
})
@Injectable()
export class SettingsState {

  @Selector()
  static isInviteQrCodeVisible(state: SettingsStateModel): boolean {
    return state.inviteQrCodeVisible;
  }

  @Action(ToggleQrCodeVisibility)
  toggleQrCodeVisibility(ctx: StateContext<SettingsStateModel>) {
    ctx.patchState({
      inviteQrCodeVisible: !ctx.getState().inviteQrCodeVisible
    });
  }

}
