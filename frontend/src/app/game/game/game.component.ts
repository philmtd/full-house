import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Api} from "../api/api.service";
import {Game, GamePhase, GameState, Participant, Vote} from "../model";
import {Select, Store} from "@ngxs/store";
import {SetCurrentUser, UserState} from "../../store/user/user.state";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {CreateUserDialogComponent} from "../../components/create-user-dialog/create-user-dialog.component";
import {WebsocketApi} from "../api/websocket-api.service";
import {first, map, tap} from "rxjs/operators";
import {InvitePlayersDialogComponent} from "../../components/invite-players-dialog/invite-players-dialog.component";
import {calculateAgreement} from "./agreement";

export interface GameModel {
  name: string;
  slug: string;
  phase: GamePhase;
  otherParticipants: Array<ParticipantModel>;
  self: ParticipantModel;
  voteCount: number;
  voteAverage: number;
  agreement: number | null;
  agreementEmoji: string;
  votingScheme: Array<number>;
}

export interface ParticipantModel {
  name: string;
  id: string;
  vote: Vote;
}

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent {
  public slug?: string;
  public game?: GameModel;
  public isError = false;
  public nextPhaseButtonDisabled: Observable<boolean>;

  @Select(UserState.currentUser)
  public currentUser$: Observable<Participant>;

  constructor(route: ActivatedRoute,
              private api: Api,
              private store: Store,
              private dialog: MatDialog,
              private wsApi: WebsocketApi) {
    route.paramMap.subscribe(params => this.initGame(params.get("slug")));
    this.nextPhaseButtonDisabled = new BehaviorSubject(false);
  }

  private initGame(slug: string | null) {
    try {
      if (slug == null) {
        throw Error("slug is null")
      }
      this.slug = slug;
      this.api.getGame(slug).subscribe(g => {
        this.currentUser$.subscribe(currentUser => {
          if (!currentUser) {
            this.createUser();
          } else if (g) {
            this.game = this.toGameModel(g, currentUser);
            this.setNextPhaseButtonDisabledState(g.gameState);
            this.wsApi.gameState(this.game.slug)
              .pipe(
                tap(g2 => this.setNextPhaseButtonDisabledState(g2.gameState)),
                map(g2 => this.toGameModel(g2, currentUser))
              )
              .subscribe(g2 => {
                this.game = g2;
              });
            this.api.joinGame(this.game.slug, currentUser)
              .pipe(
                tap(g2 => this.setNextPhaseButtonDisabledState(g2.gameState)),
                map(g2 => this.toGameModel(g2, currentUser))
              )
              .subscribe(g2 => {
                this.game = g2;
              });
          }
        });
      }, _ => {
        this.isError = true;
      })
    } catch (e) {

    }
  }

  private setNextPhaseButtonDisabledState(gameState: GameState) {
    const nextButtonActiveTime = Date.parse(gameState.lastTransition) + 3000;
    let timeToActive = nextButtonActiveTime - Date.now();
    if (timeToActive > 0) {
      (this.nextPhaseButtonDisabled as Subject<boolean>).next(true);
      setTimeout(() => {
        (this.nextPhaseButtonDisabled as Subject<boolean>).next(false);
      }, timeToActive)
    } else {
      (this.nextPhaseButtonDisabled as Subject<boolean>).next(false);
    }
  }

  private createUser() {
    this.dialog.open(CreateUserDialogComponent, {
      width: '80%'
    }).afterClosed().subscribe(participant => {
      this.store.dispatch(new SetCurrentUser(participant))
        .subscribe(() => this.wsApi.reconnect());
    })
  }

  private toParticipantModel(game: Game, participant: Participant): ParticipantModel {
    let participantVote = game.gameState.votesByParticipantId[participant.id];
    return {
      id: participant.id,
      name: participant.name,
      vote: participantVote
    }
  }

  private toGameModel(game: Game, currentUser: Participant): GameModel {
    const voteCount = Object.values(game.gameState.votesByParticipantId).filter(v => v.voted).length;
    const nonNegativeVoteCount = Object.values(game.gameState.votesByParticipantId).filter(v => v.voted && v.vote != undefined && v.vote >= 0).length;
    const voteSum = Object.values(game.gameState.votesByParticipantId).filter(v => v.voted && v.vote && v.vote >= 0).map(v => v.vote!).reduce((a, b) => a + b, 0);
    const voteAverage = Math.round((nonNegativeVoteCount > 0 ? voteSum / nonNegativeVoteCount : 0) * 100) / 100;
    const agreement = calculateAgreement(Object.values(game.gameState.votesByParticipantId));
    return {
      name: game.name,
      slug: game.slug,
      otherParticipants: game.participants.filter(p => p.id != currentUser.id).map(p => this.toParticipantModel(game, p)),
      self: this.toParticipantModel(game, currentUser),
      phase: game.gameState.phase,
      voteCount: voteCount,
      voteAverage: voteAverage,
      agreement: agreement,
      agreementEmoji: this.getAgreementEmoji(agreement),
      votingScheme: game.votingScheme
    }
  }

  private getAgreementEmoji(agreement: number | null): string {
    if (agreement == null) {
      return '🤔'
    } else if (agreement == 100) {
      return '🥳'
    } else if (agreement >= 75) {
      return '🤩'
    } else if (agreement >= 50) {
      return '🙂'
    } else if (agreement >= 25) {
      return '😕'
    } else {
      return '😡'
    }
  }

  public selectOption(option: number) {
    if (this.game?.self.vote.vote == option) {
      this.api.vote(this.game!.slug, undefined).subscribe()
    } else {
      this.api.vote(this.game!.slug, option).subscribe()
    }
  }

  openInviteDialog() {
    this.dialog.open(InvitePlayersDialogComponent, {
      width: '60%',
      minWidth: '420px'
    })
      .afterClosed()
      .subscribe();
  }

  nextPhase() {
    this.api.progressGame(this.game!.slug).subscribe();
  }

  openUserDialog() {
    this.currentUser$.pipe(first()).subscribe(user => {
      this.dialog.open(CreateUserDialogComponent, {
        width: '80%',
        data: user
      }).afterClosed().subscribe(participant => {
        if (!participant) {
          return;
        }
        this.store.dispatch(new SetCurrentUser(participant));
      });
    });
  }
}
