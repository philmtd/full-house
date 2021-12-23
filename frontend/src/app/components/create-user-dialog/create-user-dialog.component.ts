import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Participant} from "../../game/model";
import {Component, Inject} from "@angular/core";
import {Api} from "../../game/api/api.service";

@Component({
  selector: 'create-user-dialog-component',
  templateUrl: 'create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss']
})
export class CreateUserDialogComponent {

  public participant: { name: string, id?: string } = {name: ""};

  constructor(public dialogRef: MatDialogRef<CreateUserDialogComponent, Participant>,
              private api: Api,
              @Inject(MAT_DIALOG_DATA) private data?: Participant) {
    if (data) {
      this.participant = {
        name: data.name,
        id: data.id
      };
    }
  }

  public save() {
    if (this.participant.id == undefined) {
      this.api.createUser(this.participant.name).subscribe(participant => {
        this.dialogRef.close(participant);
      });
    } else {
      this.dialogRef.close({name: this.participant.name, id: this.participant.id});
    }
  }

}
