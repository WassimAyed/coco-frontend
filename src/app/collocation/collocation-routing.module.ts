import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CollocationCreateOffreComponent } from './components/collocation-createOffre/collocation-createOffre.component';
import { CollocationOffersComponent } from './components/collocation-listOffres/collocation-listOffres.component';

const routes: Routes = [
  { path: 'create-offre', component: CollocationCreateOffreComponent },
   { path: 'offres', component: CollocationOffersComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollocationRoutingModule { }
