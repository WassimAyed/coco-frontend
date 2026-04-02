import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CollocationCreateOffreComponent } from './components/collocation-createOffre/collocation-createOffre.component';
import { CollocationListComponent } from './components/collocation-listOffres/collocation-listOffres.component';
import { CollocationDetailComponent } from './components/collocation-detailOffre/collocation-detailOffre.component';
import { MesOffresComponent } from './components/collocation-mesOffres/mesOffres.component';
import { MesOffresRequestsComponent } from './components/collocation-mesOffresRequests/mes-offres-request-colloc.component';
import { RequestOffreModalComponent } from './components/request-offre-modal/request-offre-modal.component';

const routes: Routes = [
  { path: 'create-offre', component: CollocationCreateOffreComponent },
   { path: 'offres', component: CollocationListComponent },
  { path: 'offres/:id', component: CollocationDetailComponent },
  { path: 'mesOffres',  component: MesOffresComponent },
    { path: 'mesOffresRequest',  component: MesOffresRequestsComponent },
        { path: 'offresRequestModal',  component: RequestOffreModalComponent }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollocationRoutingModule { }
