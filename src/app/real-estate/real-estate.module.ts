import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyDetailComponent } from './components/property-detail/property-detail.component';
import { PropertyListComponent } from './components/property-list/property-list.component';
import { RealEstateRoutingModule } from './real-estate-routing.module';

@NgModule({
  declarations: [PropertyDetailComponent, PropertyListComponent],
  imports: [
    CommonModule,
    RealEstateRoutingModule
  ]
})
export class RealEstateModule { }
