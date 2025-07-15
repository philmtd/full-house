import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { StoryPointsSettingsState, StoryPointMapping } from '../../store/settings/story-points-settings.state';
import { SetCustomStoryPoints } from '../../store/settings/story-points-settings.actions';

@Component({
  selector: 'app-story-points',
  templateUrl: './story-points.component.html',
  styleUrls: ['./story-points.component.scss']
})
export class StoryPointsComponent {
  @Select(StoryPointsSettingsState.customStoryPoints) storyPoints$!: Observable<StoryPointMapping[]>;

  constructor(private store: Store) {}

  setCustomStoryPoints(newPoints: StoryPointMapping[]) {
    this.store.dispatch(new SetCustomStoryPoints(newPoints));
  }
}
