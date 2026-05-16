import { Component, inject, input } from "@angular/core";
import {Select, Store} from "@ngxs/store";
import {ThemingState} from "../../store/theming/theming.state";
import {Observable} from "rxjs";
import {Api} from "../../game/api/api.service";
import {MatTooltip} from "@angular/material/tooltip";
import {TranslatePipe} from "@ngx-translate/core";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  imports: [
    MatTooltip,
    TranslatePipe,
    RouterLink
  ],
  standalone: true
})
export class NavigationComponent {
  private store = inject(Store);
  private api = inject(Api);

  readonly navTitle = input<string>(undefined);

  @Select(ThemingState.isDarkMode) isDarkMode$: Observable<boolean>;

  logoSrc: string = '/assets/pplogo.svg';
  version: string = '';
  constructor() {
    //this.isDarkMode$.subscribe(isDarkMode => {
    //  this.logoSrc = `/assets/pplogo-${isDarkMode ? 'dark' : 'light'}.svg`;
    //});
    this.api.appInfo().subscribe(info => this.version = info.version);
  }
}
