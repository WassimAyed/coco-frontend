import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CollocationRoutingModule } from './collocation-routing.module';
import { CollocationCreateOffreComponent } from './components/collocation-createOffre/collocation-createOffre.component';

@NgModule({
  declarations: [CollocationCreateOffreComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    CollocationRoutingModule
  ]
})
export class CollocationModule { }
