import {MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle} from "@angular/material/dialog";
import {Participant} from "../../game/model";
import {Component, inject, signal, WritableSignal, ChangeDetectionStrategy} from "@angular/core";
import {Api} from "../../game/api/api.service";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {TranslatePipe} from "@ngx-translate/core";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'create-user-dialog-component',
  templateUrl: 'create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
  imports: [
    MatFormField,
    MatDialogTitle,
    MatDialogContent,
    MatLabel,
    FormsModule,
    TranslatePipe,
    MatInput,
    MatButton
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class CreateUserDialogComponent {
  dialogRef = inject<MatDialogRef<CreateUserDialogComponent, Participant>>(MatDialogRef);
  private api = inject(Api);
  private data = inject<Participant>(MAT_DIALOG_DATA);


  public participant: WritableSignal<{ name: string, id?: string }> = signal({name: ""});

  constructor() {
    const data = this.data;

    if (data) {
      this.participant.set({
        name: data.name,
        id: data.id
      });
    }
  }

  public save() {
    if (!this.participant()) {
      return;
    }

    if (this.participant().id == undefined) {
      this.api.createUser(this.participant().name).subscribe(participant => {
        this.dialogRef.close(participant);
      });
    } else {
      this.dialogRef.close({name: this.participant().name, id: this.participant().id!});
    }
  }

}
