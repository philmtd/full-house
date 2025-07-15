import { StoryPointMapping } from './story-points-settings.state';

export class LoadStoryPointsMapping {
  static readonly type = '[Settings] Load Story Points Mapping';
}

export class SetCustomStoryPoints {
  static readonly type = '[Settings] Set Custom Story Points';
  constructor(public payload: StoryPointMapping[]) {}
}
