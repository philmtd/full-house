import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NewGameComponent} from "./game/new-game/new-game.component";
import {GameComponent} from "./game/game/game.component";

const routes: Routes = [
  {
    path: 'new',
    component: NewGameComponent
  },
  {
    path: 'game/:slug',
    component: GameComponent
  },
  {
    path: '**',
    redirectTo: '/new'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
