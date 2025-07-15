import { State, Action, StateContext, Selector, NgxsOnInit } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LoadStoryPointsMapping, SetCustomStoryPoints } from './story-points-settings.actions';

export interface StoryPointMapping {
  value: number;
  description: string;
}

export interface StoryPointsSettingsStateModel {
  customStoryPoints: StoryPointMapping[];
}


const defaultStoryPoints: StoryPointMapping[] = [
  { value: 0, description: 'No estimate / Not started' },
  { value: 1, description: 'Less than an hour of work' },
  { value: 2, description: 'A couple hours of work' },
  { value: 3, description: 'A few hours of work' },
  { value: 5, description: 'About a day of work' },
  { value: 8, description: 'Several days of work' },
  { value: 13, description: 'About a week of work' },
  { value: 21, description: 'Multiple weeks of work' },
  { value: 34, description: 'A month or more of work' },
  { value: 55, description: 'Several months of work' },
  { value: 89, description: 'Major project, multiple quarters' }
];

const defaultState: StoryPointsSettingsStateModel = {
  customStoryPoints: defaultStoryPoints
};

@State<StoryPointsSettingsStateModel>({
  name: 'storyPointsSettings',
  defaults: defaultState
})
@Injectable()
export class StoryPointsSettingsState implements NgxsOnInit {
  constructor(private http: HttpClient) {}

  @Selector()
  static customStoryPoints(state: StoryPointsSettingsStateModel) {
    return state.customStoryPoints;
  }

  ngxsOnInit(ctx: StateContext<StoryPointsSettingsStateModel>) {
    ctx.dispatch(new LoadStoryPointsMapping());
  }

  @Action(LoadStoryPointsMapping)
  loadStoryPointsMapping(ctx: StateContext<StoryPointsSettingsStateModel>) {
    return this.http.get<StoryPointMapping[]>('/api/storyPointsMapping').pipe(
      tap((mapping) => {
        if (Array.isArray(mapping) && mapping.length > 0) {
          ctx.dispatch(new SetCustomStoryPoints(mapping));
        }
      }),
      catchError(() => of(null))
    );
  }

  @Action(SetCustomStoryPoints)
  setCustomStoryPoints(ctx: StateContext<StoryPointsSettingsStateModel>, action: SetCustomStoryPoints) {
    ctx.patchState({ customStoryPoints: action.payload });
  }
}
