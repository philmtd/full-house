import {Action, Selector, State, StateContext} from '@ngxs/store';
import {Injectable} from '@angular/core';

export interface RoomAdminSettings {
  allowOthersToReveal: boolean;
  allowOthersToRestart: boolean;
}

export interface RoomAdminStateModel {
  /** Slugs of rooms this browser created, mapped to their admin settings. */
  rooms: Record<string, RoomAdminSettings>;
}

const defaultSettings: RoomAdminSettings = {
  allowOthersToReveal: true,
  allowOthersToRestart: true,
};

const defaultState: RoomAdminStateModel = {
  rooms: {},
};

export class RegisterCreatedRoom {
  static readonly type = '[RoomAdmin] Register Created Room';
  constructor(public slug: string) {}
}

export class UpdateRoomAdminSettings {
  static readonly type = '[RoomAdmin] Update Room Admin Settings';
  constructor(public slug: string, public settings: RoomAdminSettings) {}
}

@State<RoomAdminStateModel>({
  name: 'ppRoomAdmin',
  defaults: defaultState,
})
@Injectable()
export class RoomAdminState {

  @Selector()
  static rooms(state: RoomAdminStateModel): Record<string, RoomAdminSettings> {
    return state.rooms;
  }

  static isCreator(slug: string) {
    return (state: RoomAdminStateModel): boolean => slug in state.rooms;
  }

  static settingsForRoom(slug: string) {
    return (state: RoomAdminStateModel): RoomAdminSettings =>
      state.rooms[slug] ?? defaultSettings;
  }

  @Action(RegisterCreatedRoom)
  registerCreatedRoom(ctx: StateContext<RoomAdminStateModel>, action: RegisterCreatedRoom) {
    const rooms = { ...ctx.getState().rooms };
    if (!(action.slug in rooms)) {
      rooms[action.slug] = { ...defaultSettings };
    }
    ctx.patchState({ rooms });
  }

  @Action(UpdateRoomAdminSettings)
  updateRoomAdminSettings(ctx: StateContext<RoomAdminStateModel>, action: UpdateRoomAdminSettings) {
    const rooms = { ...ctx.getState().rooms, [action.slug]: action.settings };
    ctx.patchState({ rooms });
  }
}
