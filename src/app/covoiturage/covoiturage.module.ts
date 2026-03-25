import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CovoiturageDetailComponent } from './components/covoiturage-detail/covoiturage-detail.component';
import { CovoiturageListComponent } from './components/covoiturage-list/covoiturage-list.component';
import { CovoiturageRoutingModule } from './covoiturage-routing.module';

@NgModule({
  declarations: [CovoiturageDetailComponent, CovoiturageListComponent],
  imports: [
    CommonModule,
    CovoiturageRoutingModule
  ]
})
export class CovoiturageModule { }
