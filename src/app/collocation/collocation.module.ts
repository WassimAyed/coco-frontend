import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';   // <-- add FormsModule
import { HttpClientModule } from '@angular/common/http';
import { CollocationRoutingModule } from './collocation-routing.module';
import { RouterModule } from '@angular/router';


// Import your components
import { CollocationCreateOffreComponent } from './components/collocation-createOffre/collocation-createOffre.component';
import { CollocationListComponent } from './components/collocation-listOffres/collocation-listOffres.component'; // adjust path if needed
import { LOCALE_ID } from '@angular/core';
import { CollocationDetailComponent } from './components/collocation-detailOffre/collocation-detailOffre.component';
import { MesOffresComponent } from './components/collocation-mesOffres/mesOffres.component';


@NgModule({
  declarations: [
    CollocationCreateOffreComponent,
    CollocationListComponent ,
    CollocationDetailComponent,
    MesOffresComponent
    ],
  imports: [
    CommonModule,                   // provides currency, slice, ngIf, ngFor
    FormsModule,                    // provides ngModel
    ReactiveFormsModule,
    HttpClientModule,
    CollocationRoutingModule,


  ],
  providers: [
  { provide: LOCALE_ID, useValue: 'fr-FR' }
]
})


export class CollocationModule { }
