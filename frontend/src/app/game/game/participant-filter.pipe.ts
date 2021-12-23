import {Pipe, PipeTransform} from "@angular/core";
import {ParticipantModel} from "./game.component";

type PARTICIPANT_ROW = 'top' | 'left' | 'bottom_left' | 'bottom_right' | 'right';

@Pipe({
  name: 'participantRow'
})
export class ParticipantFilterPipe implements PipeTransform {

  // top: 0, 3, 5, 7, 9
  // left: 1
  // right: 2
  // bottom_left: 4, 8
  // bottom_right: 6, 10
  transform(value: Array<ParticipantModel>, row?: PARTICIPANT_ROW): Array<ParticipantModel> {
    if (!row || !value) {
      return value;
    }

    if (row == "top") {
      return value.filter((p, idx) => idx == 0 || (idx >= 3 && (idx - 3) % 2 == 0));
    } else if (row == "left") {
      return value.filter((p, idx) => idx == 1);
    } else if (row == "bottom_left") {
      return value.filter((p, idx) => idx >= 4 && (idx - 4) % 4 == 0);
    } else if (row == "bottom_right") {
      return value.filter((p, idx) => idx >= 6 && (idx - 6) % 4 == 0);
    } else if (row == "right") {
      return value.filter((p, idx) => idx == 2);
    }

    return value;
  }

}
