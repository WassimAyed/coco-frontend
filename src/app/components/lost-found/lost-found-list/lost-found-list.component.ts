import { Component } from '@angular/core';
import { LostListComponent } from '../../../lost-found/components/lost-list/lost-list.component';

@Component({
  selector: 'app-lost-found-list',
  standalone: true,
  imports: [LostListComponent],
  template: `<app-lost-list></app-lost-list>`
})
export class LostFoundListComponent {}
