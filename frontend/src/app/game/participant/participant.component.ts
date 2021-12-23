import {Component, Input} from "@angular/core";
import {Participant, Vote} from "../model";

@Component({
  selector: 'participant',
  templateUrl: 'participant.component.html',
  styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent {
  @Input() participant?: Participant;
  @Input() revealed = false;
  @Input() vote?: Vote;
}
