import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppPaginationComponent } from './components/app-pagination/app-pagination.component';

@NgModule({
  declarations: [AppPaginationComponent],
  imports: [CommonModule],
  exports: [AppPaginationComponent]
})
export class EventPaginationModule {}
