import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, viewChild } from "@angular/core";
import {MatDialogContent, MatDialogRef, MatDialogTitle} from "@angular/material/dialog";
import {Clipboard} from "@angular/cdk/clipboard";
import {Select, Store} from "@ngxs/store";
import {Observable} from "rxjs";
import {SettingsState, ToggleQrCodeVisibility} from "../../store/settings/settings.state";
import {TranslatePipe} from "@ngx-translate/core";
import {QRCodeComponent} from "angularx-qrcode";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatIcon} from "@angular/material/icon";
import {AsyncPipe} from "@angular/common";
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
    AsyncPipe,
    MatButton,
    MatInput
  ],
  standalone: true
})
export class InvitePlayersDialogComponent implements AfterViewInit {
  private dialogRef = inject<MatDialogRef<InvitePlayersDialogComponent>>(MatDialogRef);
  private clipboard = inject(Clipboard);
  private cd = inject(ChangeDetectorRef);
  private store = inject(Store);


  public gameUrl: string;
  @Select(SettingsState.isInviteQrCodeVisible) qrCodeVisible$: Observable<boolean>;
  readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  constructor() {
    this.gameUrl = window.location.toString();
  }

  public copyUrl() {
    this.clipboard.copy(this.gameUrl);
    this.dialogRef.close();
  }

  ngAfterViewInit(): void {
    this.input().nativeElement.select();
    this.cd.detectChanges();
  }

  toggleQrCodeVisibility() {
    this.store.dispatch(new ToggleQrCodeVisibility());
  }
}
