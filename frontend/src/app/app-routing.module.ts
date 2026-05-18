import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';



const routes: Routes = [
  {
    path: 'new',
    loadComponent: () => import('./game/new-game/new-game.component').then(m => m.NewGameComponent)
  },
  {
    path: 'game/:slug',
    loadComponent: () => import('./game/game/game.component').then(m => m.GameComponent)
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
