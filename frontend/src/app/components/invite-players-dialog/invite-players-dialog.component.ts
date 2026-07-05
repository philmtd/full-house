import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, signal, viewChild} from "@angular/core";
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle} from "@angular/material/dialog";
import {Clipboard} from "@angular/cdk/clipboard";
import {Store} from "@ngxs/store";
import {SettingsState, ToggleQrCodeVisibility} from "../../store/settings/settings.state";
import {TranslatePipe} from "@ngx-translate/core";
import {QRCodeComponent} from "angularx-qrcode";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatIcon} from "@angular/material/icon";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'invite-players-dialog-component',
  templateUrl: 'invite-players-dialog.component.html',
  styleUrls: ['./invite-players-dialog.component.scss'],
  imports: [
    TranslatePipe,
    QRCodeComponent,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatLabel,
    MatIcon,
    MatButton,
    MatInput,
    MatDialogActions,
    MatDialogClose
  ],
  standalone: true,
})
export class InvitePlayersDialogComponent implements AfterViewInit {
  private dialogRef = inject<MatDialogRef<InvitePlayersDialogComponent>>(MatDialogRef);
  private clipboard = inject(Clipboard);
  private cd = inject(ChangeDetectorRef);
  private store = inject(Store);


  readonly gameUrl = signal(window.location.toString());
  readonly qrCodeVisible = this.store.selectSignal(SettingsState.isInviteQrCodeVisible);
  readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  public copyUrl() {
    this.clipboard.copy(this.gameUrl());
    this.dialogRef.close();
  }

  ngAfterViewInit(): void {
    this.input()?.nativeElement.select();
    this.cd.detectChanges();
  }

  toggleQrCodeVisibility() {
    this.store.dispatch(new ToggleQrCodeVisibility());
  }
}
