import {Component, Input} from "@angular/core";
import {Select, Store} from "@ngxs/store";
import {ThemingState} from "../../store/theming/theming.state";
import {Observable} from "rxjs";
import {Api} from "../../game/api/api.service";

@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  @Input() navTitle?: string;

  @Select(ThemingState.isDarkMode) isDarkMode$: Observable<boolean>;

  logoSrc: string = '/assets/pplogo-light.svg';
  version: string = '';
  constructor(private store: Store,
              private api: Api) {
    this.isDarkMode$.subscribe(isDarkMode => {
      this.logoSrc = `/assets/pplogo-${isDarkMode ? 'dark' : 'light'}.svg`;
    });
    this.api.appInfo().subscribe(info => this.version = info.version);
  }
}
