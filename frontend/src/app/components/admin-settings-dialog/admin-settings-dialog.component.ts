import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {Store} from '@ngxs/store';
import {RoomAdminSettings, UpdateRoomAdminSettings} from '../../store/room-admin/room-admin.state';
import {Api} from '../../game/api/api.service';
import {TranslatePipe} from '@ngx-translate/core';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';

export interface AdminSettingsDialogData {
  slug: string;
  settings: RoomAdminSettings;
}

@Component({
  selector: 'admin-settings-dialog',
  templateUrl: './admin-settings-dialog.component.html',
  styleUrls: ['./admin-settings-dialog.component.scss'],
  imports: [
    TranslatePipe,
    MatDialogTitle,
    MatDialogContent,
    MatSlideToggle,
    FormsModule,
  ],
  standalone: true,
})
export class AdminSettingsDialogComponent {
  private store = inject(Store);
  private api = inject(Api);
  readonly data = inject<AdminSettingsDialogData>(MAT_DIALOG_DATA);

  allowOthersToReveal = this.data.settings.allowOthersToReveal;
  allowOthersToRestart = this.data.settings.allowOthersToRestart;

  onRevealChange(value: boolean) {
    this.allowOthersToReveal = value;
    this.persist();
  }

  onRestartChange(value: boolean) {
    this.allowOthersToRestart = value;
    this.persist();
  }

  private persist() {
    const settings: RoomAdminSettings = {
      allowOthersToReveal: this.allowOthersToReveal,
      allowOthersToRestart: this.allowOthersToRestart,
    };
    // Persist to local NGXS store (survives page refresh for the admin)
    this.store.dispatch(new UpdateRoomAdminSettings(this.data.slug, settings));
    // Broadcast to all other clients via the server → WebSocket push
    this.api.updateAdminSettings(this.data.slug, settings).subscribe();
  }
}
