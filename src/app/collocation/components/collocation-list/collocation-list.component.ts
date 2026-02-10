import { Component, OnInit } from '@angular/core';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-collocation-list-offres',
   templateUrl: './collocation-list.component.html'

})
export class CollocationListOffresComponent implements OnInit {
  offers: any[] = [];

  constructor(private collocationService: CollocationService) {}

  ngOnInit(): void {
    this.collocationService.getAllOffers().subscribe({
      next: (data) => this.offers = data,
      error: (err) => console.error('Failed to load offers', err)
    });
  }
}
