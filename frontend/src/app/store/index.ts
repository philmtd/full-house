import {UserState} from "./user/user.state";
import {ThemingState} from "./theming/theming.state";
import {SettingsState} from "./settings/settings.state";
import {StoryPointsSettingsState} from "./settings/story-points-settings.state";

export const appStates = [
  ThemingState,
  UserState,
  SettingsState,
  StoryPointsSettingsState
];
