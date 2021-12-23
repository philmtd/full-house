import {AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {Clipboard} from "@angular/cdk/clipboard";

@Component({
  selector: 'invite-players-dialog-component',
  templateUrl: 'invite-players-dialog.component.html',
  styleUrls: ['./invite-players-dialog.component.scss']
})
export class InvitePlayersDialogComponent implements AfterViewInit {

  public gameUrl: string;

  @ViewChild('input') input: ElementRef<HTMLInputElement>;

  constructor(private dialogRef: MatDialogRef<InvitePlayersDialogComponent>,
              private clipboard: Clipboard,
              private cd: ChangeDetectorRef) {
    this.gameUrl = window.location.toString();
  }

  public copyUrl() {
    this.clipboard.copy(this.gameUrl);
    this.dialogRef.close();
  }

  ngAfterViewInit(): void {
    this.input.nativeElement.select();
    this.cd.detectChanges();
  }

}
