import {Pipe, PipeTransform} from "@angular/core";
import {ParticipantModel} from "./game.component";

type PARTICIPANT_ROW = 'top' | 'left' | 'bottom_left' | 'bottom_right' | 'right';

@Pipe({
  name: 'participantRow'
})
export class ParticipantFilterPipe implements PipeTransform {

  // top: 0, 1, 3, 7, 9, 11, 13, ...
  // left: 5
  // right: 6
  // bottom_left: 2, 8, 12, ...
  // "bottom_middle": self
  // bottom_right: 4, 10, 14, ...
  transform(value: Array<ParticipantModel>, row?: PARTICIPANT_ROW): Array<ParticipantModel> {
    if (!row || !value) {
      return value;
    }

    if (row == "top") {
      return value.filter((p, idx) => idx == 0 || idx == 1 || idx == 3 || (idx >= 7 && (idx - 7) % 2 == 0));
    } else if (row == "left") {
      return value.filter((p, idx) => idx == 5);
    } else if (row == "bottom_left") {
      return value.filter((p, idx) => idx == 2 || idx >= 8 && (idx - 4) % 4 == 0);
    } else if (row == "bottom_right") {
      return value.filter((p, idx) => idx == 4 || idx >= 10 && (idx - 6) % 4 == 0);
    } else if (row == "right") {
      return value.filter((p, idx) => idx == 6);
    }

    return value;
  }

}
