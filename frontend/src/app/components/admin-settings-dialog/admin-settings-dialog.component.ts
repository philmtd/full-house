import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import {AdminSettings} from '../../game/model';
import {Api} from '../../game/api/api.service';
import {TranslatePipe} from '@ngx-translate/core';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {MatButton} from "@angular/material/button";

export interface AdminSettingsDialogData {
  slug: string;
  settings: AdminSettings;
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
    MatDialogActions,
    MatButton,
    MatDialogClose,
  ],
  standalone: true,
})
export class AdminSettingsDialogComponent {
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
    const settings: AdminSettings = {
      allowOthersToReveal: this.allowOthersToReveal,
      allowOthersToRestart: this.allowOthersToRestart,
    };
    this.api.updateAdminSettings(this.data.slug, settings).subscribe();
  }
}
