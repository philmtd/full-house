import {Component, computed, inject, linkedSignal, signal, ChangeDetectionStrategy} from "@angular/core";
import {Router} from "@angular/router";
import {Api} from "../api/api.service";
import {VotingScheme} from "../model";
import {transformToFraction} from "../game/fraction-filter.pipe";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {FormsModule} from "@angular/forms";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {ThemeSwitcherComponent} from "../../components/theme-switcher/theme-switcher.component";
import {NavigationComponent} from "../../components/navigation/navigation.component";
import {toSignal} from "@angular/core/rxjs-interop";
import {map} from "rxjs/operators";

interface VotingSchemeModel {
  scheme: VotingScheme;
  label: string;
  id: string;
}

@Component({
  selector: 'new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss'],
  imports: [
    TranslatePipe,
    FormsModule,
    MatLabel,
    MatFormField,
    MatSelect,
    MatOption,
    MatButton,
    ThemeSwitcherComponent,
    NavigationComponent,
    MatInput
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class NewGameComponent {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);


  readonly gameName = signal('');
  readonly votingSchemes = toSignal(this.api.votingSchemes().pipe(map(schemes => schemes.map(scheme => {
    return <VotingSchemeModel>{
      scheme: scheme,
      label: this.createLabel(scheme),
      id: scheme.name
    }
  }))));
  readonly selectedScheme = linkedSignal(() => {
    const schemes = this.votingSchemes();
    if (schemes !== undefined) {
      return schemes[0].id;
    }
    return '';
  });

  createGame() {
    this.api.createNewGame(this.gameName(), this.getSchemeById(this.selectedScheme())).subscribe({
      next: game => {
        this.router.navigate([`/game/`, game.slug]);
      },
      error: err => {
        this.snackBar.open(this.translate.instant("newGame.failedToCreateGame"), undefined, {
          duration: 5000
        });
      }
    });
  }

  private getSchemeById(id: string): VotingScheme {
    return this.votingSchemes().filter(v => v.id === id)[0].scheme;
  }

  private createLabel(scheme: VotingScheme): string {
    let res = `${scheme.name} (`;
    res += scheme.scheme.map((v, i) => scheme.labels?.[i] ?? transformToFraction(v)).join(", ")
    if (scheme.includesQuestionmark) {
      res += `, ?`
    }
    return `${res})`
  }
}
