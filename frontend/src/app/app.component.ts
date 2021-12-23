import {Component, Inject} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {Select, Store} from "@ngxs/store";
import {Observable} from "rxjs";
import {ThemingState} from "./store/theming/theming.state";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @Select(ThemingState.isDarkMode) isDarkTheme$: Observable<boolean>;

  constructor(private store: Store, @Inject(DOCUMENT) private document: Document) {
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
