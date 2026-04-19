import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../../services/review.service';
import { Review } from '../../../models/review.model';

@Component({
  selector: 'app-furniture-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './furniture-reviews.component.html',
  styleUrls: ['./furniture-reviews.component.scss']
})
export class FurnitureReviewsComponent implements OnInit {
  furnitureId: number = 0;
  reviews: Review[] = [];
  loading = false;
  success?: string;
  error?: string;
  hoveredStar = 0;

  newReview: Review = {
    furnitureId: 0,
    reviewerId: 1,
    rating: 0,
    comment: ''
  };

  constructor(
    private reviewService: ReviewService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.furnitureId = Number(params.get('id'));
      this.newReview.furnitureId = this.furnitureId;
      this.loadReviews();
    });
  }

  loadReviews(): void {
    this.loading = true;
    this.reviewService.getByFurniture(this.furnitureId).subscribe({
      next: (data) => { this.reviews = data; this.loading = false; },
      error: () => { this.error = 'Erreur chargement.'; this.loading = false; }
    });
  }

  setRating(star: number): void {
    this.newReview.rating = star;
  }

  submitReview(): void {
    if (!this.newReview.rating || this.newReview.rating < 1) {
      this.error = 'Veuillez choisir une note.';
      return;
    }
    this.loading = true;
    this.reviewService.create(this.newReview).subscribe({
      next: () => {
        this.success = '✅ Avis envoyé avec succès !';
        this.error = undefined;
        this.newReview.rating = 0;
        this.newReview.comment = '';
        this.loadReviews();
      },
      error: () => { this.error = 'Erreur lors de l\'envoi.'; this.loading = false; }
    });
  }

  deleteReview(id?: number): void {
    if (!id) return;
    this.reviewService.delete(id).subscribe({ next: () => this.loadReviews() });
  }

  getAverageRating(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  getStars(rating: number): string[] {
    return Array(5).fill('').map((_, i) => i < rating ? '⭐' : '☆');
  }

  getRatingCount(star: number): number {
    return this.reviews.filter(r => r.rating === star).length;
  }

  getBarWidth(star: number): string {
    if (!this.reviews.length) return '0%';
    return `${(this.getRatingCount(star) / this.reviews.length) * 100}%`;
  }
}
