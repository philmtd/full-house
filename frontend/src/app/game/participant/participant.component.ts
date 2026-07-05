import {Component, computed, input, ChangeDetectionStrategy} from "@angular/core";
import {Participant, Vote, VotingScheme} from "../model";
import {FractionFilterPipe} from "../game/fraction-filter.pipe";

interface VoteModel extends Vote {
  label?: string;
}

@Component({
  selector: 'participant',
  templateUrl: 'participant.component.html',
  styleUrls: ['./participant.component.scss'],
  imports: [FractionFilterPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class ParticipantComponent {
  readonly participant = input<Participant>(undefined);
  readonly revealed = input(false);
  readonly vote = input<Vote | undefined>(undefined);
  readonly votingScheme = input<VotingScheme>(undefined);

  readonly voteModel = computed<VoteModel>(() => {
    let vote = this.vote();
    let label;
    if (vote) {
      const votingScheme = this.votingScheme();
      if (!votingScheme?.labels) {
        return vote;
      } else if (Number.isFinite(vote.vote)) {
        const index = votingScheme.scheme.indexOf(vote.vote as number)
        label = index >= 0 ? votingScheme.labels[index] : undefined;
      }
      return {
        ...vote,
        label: label
      }
    }
  })
}
