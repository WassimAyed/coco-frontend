import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CollocationCreateOffreComponent } from './components/collocation-createOffre/collocation-createOffre.component';
import { CollocationListOffresComponent } from './components/collocation-list/collocation-list.component';

const routes: Routes = [
  { path: 'create-offer', component: CollocationCreateOffreComponent },
   { path: 'offers', component: CollocationListOffresComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollocationRoutingModule { }
