import { Component, OnInit } from '@angular/core';
import { CollocationOffer } from '../../models/collocationOffre.model';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-collocation-offers',
  templateUrl: './collocation-listOffres.component.html',
  styleUrls: ['./collocation-listOffres.component.css']
})
export class CollocationOffersComponent implements OnInit {
  offers: CollocationOffer[] = [];   // Use the correct model
  loading = false;
  error: string | null = null;

  constructor(private collocationService: CollocationService) {} // Use the imported service

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading = true;
    this.error = null;
    this.collocationService.getAllOffers().subscribe({
      next: (data) => {
        this.offers = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load offers. Please try again later.';
        this.loading = false;
        console.error('Error fetching offers:', err);
      }
    });
  }
}
