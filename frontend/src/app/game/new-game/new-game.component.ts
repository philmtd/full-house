import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {Api} from "../api/api.service";
import {EXTENDED_FIBONACCI_VOTE_SCHEME, FIBONACCI_VOTE_SCHEME, VotingScheme} from "../model";
import {transformToFraction} from "../game/fraction-filter.pipe";

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
  votingSchemes: Array<VotingSchemeModel> = [{
    scheme: FIBONACCI_VOTE_SCHEME,
    id: 'fibonacci',
    label: this.createLabel(FIBONACCI_VOTE_SCHEME)
  }, {
    scheme: EXTENDED_FIBONACCI_VOTE_SCHEME,
    id: 'extendedFibonacci',
    label: this.createLabel(EXTENDED_FIBONACCI_VOTE_SCHEME)
  }];
  selectedScheme = 'fibonacci';

  constructor(private api: Api,
              private router: Router) {
  }

  createGame() {
    this.api.createNewGame(this.gameName, this.getSchemeById(this.selectedScheme)).subscribe(game => {
      this.router.navigate([`/game/`, game.slug]);
    });
  }

  private getSchemeById(id: string): Array<number> {
    return this.votingSchemes.filter(v => v.id === id)[0].scheme.scheme;
  }

  private createLabel(scheme: VotingScheme): string {
    let res = `${scheme.name} (`;
    res += scheme.scheme.map(v => transformToFraction(v)).join(", ")
    return `${res})`
  }
}
