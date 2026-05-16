import {Component, inject, OnDestroy, signal} from "@angular/core";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {Api} from "../api/api.service";
import {Game, GamePhase, GameState, Participant, Vote, VoteOption, VotingScheme} from "../model";
import {Store} from "@ngxs/store";
import {SetCurrentUser, UserState} from "../../store/user/user.state";
import {combineLatest, merge, Subject, Subscription} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {CreateUserDialogComponent} from "../../components/create-user-dialog/create-user-dialog.component";
import {WebsocketApi} from "../api/websocket-api.service";
import {filter, first, map, switchMap, takeUntil, tap} from "rxjs/operators";
import {InvitePlayersDialogComponent} from "../../components/invite-players-dialog/invite-players-dialog.component";
import {calculateAgreement, isVoteNumerical} from "./agreement";
import {TranslatePipe} from "@ngx-translate/core";
import {FractionFilterPipe} from "./fraction-filter.pipe";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatButton, MatIconButton} from "@angular/material/button";
import {ParticipantComponent} from "../participant/participant.component";
import {MatIcon} from "@angular/material/icon";
import {ThemeSwitcherComponent} from "../../components/theme-switcher/theme-switcher.component";
import {NavigationComponent} from "../../components/navigation/navigation.component";
import {ParticipantFilterPipe} from "./participant-filter.pipe";
import {MatTooltip} from "@angular/material/tooltip";

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
  votingScheme: VotingScheme;
}

export interface ParticipantModel {
  name: string;
  id: string;
  vote: Vote;
}

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [
    TranslatePipe,
    FractionFilterPipe,
    MatProgressSpinner,
    RouterLink,
    MatButton,
    ParticipantComponent,
    MatIcon,
    ThemeSwitcherComponent,
    MatIconButton,
    NavigationComponent,
    ParticipantFilterPipe,
    MatTooltip
  ],
  standalone: true
})
export class GameComponent implements OnDestroy {
  private api = inject(Api);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private wsApi = inject(WebsocketApi);
  private route = inject(ActivatedRoute);

  public slug?: string;
  public game = signal<GameModel>(undefined as any);
  public isError = false;
  public nextPhaseButtonDisabled = signal(false);

  public currentUser$ = this.store.select(UserState.currentUser);
  private destroy$ = new Subject<void>();

  constructor() {
    this.route.paramMap.pipe(
      map(params => params.get("slug")),
      tap(slug => {
        if (!slug) this.isError = true;
        this.slug = slug ?? undefined;
      }),
      filter((slug): slug is string => !!slug),
      switchMap(slug => combineLatest([
        this.api.getGame(slug),
        this.currentUser$
      ])),
      takeUntil(this.destroy$)
    ).subscribe(([game, currentUser]) => {
      if (!currentUser) {
        this.createUser();
      } else if (game) {
        this.startGameStateSubscription(game, currentUser);
      }
    });
  }

  private gameStateSubscription?: Subscription;

  private startGameStateSubscription(initialGame: Game, currentUser: Participant) {
    this.gameStateSubscription?.unsubscribe();

    this.game.set(this.toGameModel(initialGame, currentUser));
    this.setNextPhaseButtonDisabledState(initialGame.gameState);

    this.gameStateSubscription = merge(
      this.wsApi.gameState(initialGame.slug),
      this.api.joinGame(initialGame.slug, currentUser)
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(g => {
      this.game.set(this.toGameModel(g, currentUser));
      this.setNextPhaseButtonDisabledState(g.gameState);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.gameStateSubscription?.unsubscribe();
  }

  private initGame(slug: string | null) {
    // Deprecated, logic moved to constructor
  }

  private setNextPhaseButtonDisabledState(gameState: GameState) {
    const nextButtonActiveTime = Date.parse(gameState.lastTransition) + 3000;
    let timeToActive = nextButtonActiveTime - Date.now();
    if (timeToActive > 0) {
      this.nextPhaseButtonDisabled.set(true);
      setTimeout(() => {
        this.nextPhaseButtonDisabled.set(false);
      }, timeToActive)
    } else {
      this.nextPhaseButtonDisabled.set(false);
    }
  }

  private createUser() {
    this.dialog.open(CreateUserDialogComponent, {
      width: '80%'
    }).afterClosed().subscribe(participant => {
      if (!participant) return;
      this.store.dispatch(new SetCurrentUser(participant)).subscribe(() => {
        // Always try to join the game after user creation
        if (this.slug) {
          this.api.joinGame(this.slug, participant).subscribe({
            next: () => {
              this.wsApi.reconnect();
            },
            error: err => {
              // If join fails, show error and do not reconnect
              this.isError = true;
            }
          });
        } else {
          this.wsApi.reconnect();
        }
      });
    });
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
    const nonQuestionmarkVoteCount = Object.values(game.gameState.votesByParticipantId).filter(v => v.voted && isVoteNumerical(v)).length;
    const voteSum = Object.values(game.gameState.votesByParticipantId).filter(v => v.voted && isVoteNumerical(v)).map(v => v.vote! as number).reduce((a, b) => a + b, 0);
    const voteAverage = Math.round((nonQuestionmarkVoteCount > 0 ? voteSum / nonQuestionmarkVoteCount : 0) * 100) / 100;
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

  public labelForAverage(average: number, votingScheme: VotingScheme): string | undefined {
    if (!votingScheme.labels) return undefined;
    const nearest = votingScheme.scheme.reduce((a, b) => Math.abs(b - average) <= Math.abs(a - average) ? b : a);
    const index = votingScheme.scheme.indexOf(nearest);
    return votingScheme.labels[index];
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
    } else if (agreement >= 30) {
      return '😐'
    } else if (agreement >= 15) {
      return '😕'
    } else {
      return '😡'
    }
  }

  public selectOption(option: VoteOption) {
    if (this.game()?.self?.vote.vote == option) {
      this.api.vote(this.game()!.slug, undefined).subscribe()
    } else {
      this.api.vote(this.game()!.slug, option).subscribe()
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
    this.api.progressGame(this.game()!.slug).subscribe();
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

  getSchemeTooltip(option: number): string {
    const scheme = this.game()?.votingScheme;
    if (scheme?.schemeTooltipMapping) {
      for (const op of scheme.schemeTooltipMapping) {
        if (op.value === option) {
          return op.tooltip;
        }
      }
    }
    return '';
  }
}
