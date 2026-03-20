import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollocationDetailComponent } from './components/collocation-detail/collocation-detail.component';
import { CollocationListComponent } from './components/collocation-list/collocation-list.component';
import { CollocationRoutingModule } from './collocation-routing.module';

@NgModule({
  declarations: [CollocationDetailComponent, CollocationListComponent],
  imports: [
    CommonModule,
    CollocationRoutingModule
  ]
})
export class CollocationModule { }
