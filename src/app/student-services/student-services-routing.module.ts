import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyServicePostsPageComponent } from './pages/my-service-posts-page/my-service-posts-page.component';
import { ProviderServiceRequestsPageComponent } from './pages/provider-service-requests-page/provider-service-requests-page.component';
import { ServiceDetailPageComponent } from './pages/service-detail-page/service-detail-page.component';
import { ServiceFormPageComponent } from './pages/service-form-page/service-form-page.component';
import { ServiceRecommendationsPageComponent } from './pages/service-recommendations-page/service-recommendations-page.component';
import { ServicesMarketplacePageComponent } from './pages/services-marketplace-page/services-marketplace-page.component';

const routes: Routes = [
  { path: '', component: ServicesMarketplacePageComponent },
  { path: 'new', component: ServiceFormPageComponent },
  { path: 'my-posts', component: MyServicePostsPageComponent },
  { path: 'recommendations', component: ServiceRecommendationsPageComponent },
  { path: 'provider-requests', component: ProviderServiceRequestsPageComponent },
  { path: ':id/edit', component: ServiceFormPageComponent },
  { path: ':id', component: ServiceDetailPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentServicesRoutingModule {}
