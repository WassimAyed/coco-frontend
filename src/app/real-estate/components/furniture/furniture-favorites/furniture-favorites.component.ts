import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Furniture } from '../../../models/furniture';

@Component({
  selector: 'app-furniture-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './furniture-favorites.component.html',
  styleUrls: ['./furniture-favorites.component.scss'],
})
export class FurnitureFavoritesComponent implements OnInit {
  favorites: Furniture[] = [];

  ngOnInit(): void {
    const saved = localStorage.getItem('furniture_favorites');
    this.favorites = saved ? JSON.parse(saved) : [];
  }

  removeFavorite(id?: number): void {
    this.favorites = this.favorites.filter(f => f.id !== id);
    localStorage.setItem('furniture_favorites', JSON.stringify(this.favorites));
  }

  getConditionClass(condition: string): string {
    switch (condition) {
      case 'GOOD': return 'badge-good';
      case 'FAIR': return 'badge-fair';
      case 'POOR': return 'badge-poor';
      default: return '';
    }
  }
}