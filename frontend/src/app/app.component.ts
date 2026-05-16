import { Component, DOCUMENT, inject } from '@angular/core';

import {Select, Store} from "@ngxs/store";
import {Observable} from "rxjs";
import {ThemingState} from "./store/theming/theming.state";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet
  ],
  standalone: true
})
export class AppComponent {
  private store = inject(Store);
  private document = inject<Document>(DOCUMENT);


  @Select(ThemingState.isDarkMode) isDarkTheme$: Observable<boolean>;

  constructor() {
    this.isDarkTheme$.subscribe(isDarkTheme => {
      const bodyClassList = this.document.body.classList;
      if (isDarkTheme) {
        bodyClassList.add('dark-theme');
      } else {
        bodyClassList.remove('dark-theme');
      }
    });
  }

}
