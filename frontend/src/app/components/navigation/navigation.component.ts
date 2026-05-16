import {Component, inject, input, signal} from "@angular/core";
import {Api} from "../../game/api/api.service";
import {MatTooltip} from "@angular/material/tooltip";
import {TranslatePipe} from "@ngx-translate/core";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  imports: [
    MatTooltip,
    TranslatePipe,
    RouterLink
  ],
  standalone: true
})
export class NavigationComponent {
  private api = inject(Api);

  readonly navTitle = input<string>('');
  version = signal('');

  constructor() {
    this.api.appInfo().subscribe(info => this.version.set(info.version));
  }
}
