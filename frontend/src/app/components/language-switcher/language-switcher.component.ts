import {ChangeDetectionStrategy, Component, inject, signal} from "@angular/core";
import {Store} from "@ngxs/store";
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {AppLanguage, SetLanguage, SettingsState} from "../../store/settings/settings.state";

interface LanguageModel {
  label: string;
  language: AppLanguage;
}

@Component({
  selector: 'pp-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
  imports: [
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class LanguageSwitcherComponent {
  private store = inject(Store);

  readonly languages = signal<Array<LanguageModel>>([
    {
      label: 'Deutsch',
      language: 'de'
    }, {
      label: 'English',
      language: 'en'
    }
  ]);

  readonly currentLanguage = this.store.selectSignal(SettingsState.language);

  setLanguage(language: AppLanguage) {
    this.store.dispatch(new SetLanguage(language));
  }
}
