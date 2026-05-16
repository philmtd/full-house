import {Component, Input} from "@angular/core";
import {Participant, Vote, VotingScheme} from "../model";

@Component({
  selector: 'participant',
  templateUrl: 'participant.component.html',
  styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent {
  @Input() participant?: Participant;
  @Input() revealed = false;
  @Input() vote?: Vote | undefined;
  @Input() votingScheme?: VotingScheme;

  public labelForVote(vote: number | undefined): string | undefined {
    if (vote == undefined || !this.votingScheme?.labels) return undefined;
    const index = this.votingScheme.scheme.indexOf(vote);
    return index >= 0 ? this.votingScheme.labels[index] : undefined;
  }
}
