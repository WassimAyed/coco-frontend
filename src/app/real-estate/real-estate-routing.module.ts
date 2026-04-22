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
    path: 'furniture/dashboard',
    loadComponent: () => import('./components/furniture/furniture-dashboard/furniture-dashboard.component').then(m => m.FurnitureDashboardComponent),
  },
  {
    path: 'furniture/archive',
    loadComponent: () => import('./components/furniture/furniture-archive/furniture-archive.component').then(m => m.FurnitureArchiveComponent),
  },
  {
    path: 'furniture/reports',
    loadComponent: () => import('./components/furniture/furniture-reports/furniture-reports.component').then(m => m.FurnitureReportsComponent),
  },
  {
    path: 'furniture/notifications',
    loadComponent: () => import('./components/furniture/furniture-notifications/furniture-notifications.component').then(m => m.FurnitureNotificationsComponent),
  },
  {
    path: 'furniture/cart',
    loadComponent: () => import('./components/furniture/furniture-cart/furniture-cart.component').then(m => m.FurnitureCartComponent),
  },
  {
    path: 'furniture/favorites',
    loadComponent: () => import('./components/furniture/furniture-favorites/furniture-favorites.component').then(m => m.FurnitureFavoritesComponent),
  },
  {
    path: 'furniture/edit/:id',
    loadComponent: () => import('./components/furniture/furniture-form/furniture-form.component').then(m => m.FurnitureFormComponent),
  },
  {
    path: 'furniture/:id/offers',
    loadComponent: () => import('./components/furniture/Furniture-offers/furniture-offers.component').then(m => m.FurnitureOffersComponent),
  },
  {
    path: 'furniture/:id/report',
    loadComponent: () => import('./components/furniture/furniture-report/furniture-report.component').then(m => m.FurnitureReportComponent),
  },
  {
    path: 'furniture/:id/reviews',
    loadComponent: () => import('./components/furniture/furniture-reviews/furniture-reviews.component').then(m => m.FurnitureReviewsComponent),
  },
  {
    path: 'furniture/:id/boost',
    loadComponent: () => import('./components/furniture/furniture-boost/furniture-boost.component').then(m => m.FurnitureBoostComponent),
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
