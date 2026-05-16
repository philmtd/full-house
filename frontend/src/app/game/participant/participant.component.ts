import {Component, input} from "@angular/core";
import {Participant, Vote, VotingScheme} from "../model";
import {FractionFilterPipe} from "../game/fraction-filter.pipe";

@Component({
  selector: 'participant',
  templateUrl: 'participant.component.html',
  styleUrls: ['./participant.component.scss'],
  imports: [FractionFilterPipe],
  standalone: true,
})
export class ParticipantComponent {
  readonly participant = input<Participant>(undefined);
  readonly revealed = input(false);
  readonly vote = input<Vote | undefined>(undefined);
  readonly votingScheme = input<VotingScheme>(undefined);

  public labelForVote(vote: number | undefined): string | undefined {
    const votingScheme = this.votingScheme();
    if (vote == undefined || !votingScheme?.labels) return undefined;
    const index = votingScheme.scheme.indexOf(vote);
    return index >= 0 ? votingScheme.labels[index] : undefined;
  }
}
