import { Component, DOCUMENT, inject, viewChild, ViewContainerRef, effect, ChangeDetectionStrategy } from '@angular/core';
import { Store } from "@ngxs/store";
import { ThemingState } from "./store/theming/theming.state";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class AppComponent {
  private store = inject(Store);
  private document = inject<Document>(DOCUMENT);

  isDarkTheme = this.store.selectSignal(ThemingState.isDarkMode);

  constructor() {
    effect(() => {
      const isDarkTheme = this.isDarkTheme();
      const bodyClassList = this.document.body.classList;
      if (isDarkTheme) {
        bodyClassList.add('dark');
      } else {
        bodyClassList.remove('dark');
      }
    });
  }
}
