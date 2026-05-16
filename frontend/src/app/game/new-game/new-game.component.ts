import { Component, inject } from "@angular/core";
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
  standalone: true
})
export class NewGameComponent {
  private api = inject(Api);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);


  gameName: string = "";
  votingSchemes: Array<VotingSchemeModel> = [];
  selectedScheme = '';

  constructor() {
    this.api.votingSchemes().subscribe(votingSchemes => this.initVotingSchemes(votingSchemes));
  }

  private initVotingSchemes(schemes: Array<VotingScheme>) {
    this.votingSchemes = schemes.map(scheme => {
      return <VotingSchemeModel>{
        scheme: scheme,
        label: this.createLabel(scheme),
        id: scheme.name
      }
    });
    this.selectedScheme = this.votingSchemes[0]?.id;
  }

  createGame() {
    this.api.createNewGame(this.gameName, this.getSchemeById(this.selectedScheme)).subscribe({
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
    return this.votingSchemes.filter(v => v.id === id)[0].scheme;
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
