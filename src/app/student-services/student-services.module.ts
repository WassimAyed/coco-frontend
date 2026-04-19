import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ServiceCardComponent } from './components/service-card/service-card.component';
import { ServiceFilterPanelComponent } from './components/service-filter-panel/service-filter-panel.component';
import { ServicesPaginationComponent } from './components/services-pagination/services-pagination.component';
import { MyServicePostsPageComponent } from './pages/my-service-posts-page/my-service-posts-page.component';
import { ProviderServiceRequestsPageComponent } from './pages/provider-service-requests-page/provider-service-requests-page.component';
import { ServiceDetailPageComponent } from './pages/service-detail-page/service-detail-page.component';
import { ServiceFormPageComponent } from './pages/service-form-page/service-form-page.component';
import { ServiceRecommendationsPageComponent } from './pages/service-recommendations-page/service-recommendations-page.component';
import { ServicesMarketplacePageComponent } from './pages/services-marketplace-page/services-marketplace-page.component';
import { StudentServicesRoutingModule } from './student-services-routing.module';

@NgModule({
  declarations: [
    ServiceCardComponent,
    ServiceFilterPanelComponent,
    ServicesPaginationComponent,
    MyServicePostsPageComponent,
    ProviderServiceRequestsPageComponent,
    ServiceDetailPageComponent,
    ServiceFormPageComponent,
    ServiceRecommendationsPageComponent,
    ServicesMarketplacePageComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    StudentServicesRoutingModule,
  ],
})
export class StudentServicesModule {}
