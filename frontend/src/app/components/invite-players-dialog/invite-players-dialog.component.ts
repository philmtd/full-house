import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {Clipboard} from "@angular/cdk/clipboard";
import {Select, Store} from "@ngxs/store";
import {Observable} from "rxjs";
import {SettingsState, ToggleQrCodeVisibility} from "../../store/settings/settings.state";

@Component({
  selector: 'invite-players-dialog-component',
  templateUrl: 'invite-players-dialog.component.html',
  styleUrls: ['./invite-players-dialog.component.scss'],
})
export class InvitePlayersDialogComponent implements AfterViewInit {

  public gameUrl: string;
  @Select(SettingsState.isInviteQrCodeVisible) qrCodeVisible$: Observable<boolean>;
  @ViewChild('input') input: ElementRef<HTMLInputElement>;

  constructor(private dialogRef: MatDialogRef<InvitePlayersDialogComponent>,
              private clipboard: Clipboard,
              private cd: ChangeDetectorRef,
              private store: Store) {
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

  toggleQrCodeVisibility() {
    this.store.dispatch(new ToggleQrCodeVisibility());
  }
}
