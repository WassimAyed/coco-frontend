import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CollocationCreateOffreComponent } from './components/collocation-createOffre/collocation-createOffre.component';
import { CollocationListComponent } from './components/collocation-listOffres/collocation-listOffres.component';
import { CollocationDetailComponent } from './components/collocation-detailOffre/collocation-detailOffre.component';

const routes: Routes = [
  { path: 'create-offre', component: CollocationCreateOffreComponent },
   { path: 'offres', component: CollocationListComponent },
  { path: 'offres/:id', component: CollocationDetailComponent }



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollocationRoutingModule { }
