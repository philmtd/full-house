import {UserState} from "./user/user.state";
import {ThemingState} from "./theming/theming.state";
import {SettingsState} from "./settings/settings.state";
import {RoomAdminState} from "./room-admin/room-admin.state";

export const appStates = [
  ThemingState,
  UserState,
  SettingsState,
  RoomAdminState,
];
