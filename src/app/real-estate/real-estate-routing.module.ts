import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'furniture',
    loadComponent: () => import('./components/furniture/furniture-list/furniture-list.component').then(m => m.FurnitureListComponent),
  },
  {
    path: 'furniture/new',
    loadComponent: () => import('./components/furniture/furniture-form/furniture-form.component').then(m => m.FurnitureFormComponent),
  },
  {
    path: 'furniture/edit/:id',
    loadComponent: () => import('./components/furniture/furniture-form/furniture-form.component').then(m => m.FurnitureFormComponent),
  },
  {
    path: 'furniture/:id',
    loadComponent: () => import('./components/furniture/furniture-detail/furniture-detail.component').then(m => m.FurnitureDetailComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RealEstateRoutingModule {}
