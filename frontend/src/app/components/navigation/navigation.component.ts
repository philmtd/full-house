import {Component, Input} from "@angular/core";
import {Select, Store} from "@ngxs/store";
import {ThemingState} from "../../store/theming/theming.state";
import {Observable} from "rxjs";

@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  @Input() navTitle?: string;

  @Select(ThemingState.isDarkMode) isDarkMode$: Observable<boolean>;

  logoSrc: string = '/assets/pplogo-light.svg';

  constructor(private store: Store) {
    this.isDarkMode$.subscribe(isDarkMode => {
      this.logoSrc = `/assets/pplogo-${isDarkMode ? 'dark' : 'light'}.svg`;
    });
  }
}
