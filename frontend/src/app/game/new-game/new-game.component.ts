import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {Api} from "../api/api.service";
import {VotingScheme} from "../model";
import {transformToFraction} from "../game/fraction-filter.pipe";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TranslateService} from "@ngx-translate/core";

interface VotingSchemeModel {
  scheme: VotingScheme;
  label: string;
  id: string;
}

@Component({
  selector: 'new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss']
})
export class NewGameComponent {

  gameName: string = "";
  votingSchemes: Array<VotingSchemeModel> = [];
  selectedScheme = '';

  constructor(private api: Api,
              private router: Router,
              private snackBar: MatSnackBar,
              private translate: TranslateService) {
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
    res += scheme.scheme.map(v => transformToFraction(v)).join(", ")
    if (scheme.includesQuestionmark) {
      res += `, ?`
    }
    return `${res})`
  }
}
