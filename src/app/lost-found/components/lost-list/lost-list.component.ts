import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
  selector: 'app-lost-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="lost-page">
      <div class="header-section">
        <h1>Objets Trouvés & Perdus</h1>
        <p>Retrouvez vos effets personnels en un clic.</p>
        <button class="btn btn-red" routerLink="post">Annoncer un objet</button>
      </div>

      <div class="filter-bar">
        <!-- Filtres à venir -->
      </div>

      <div class="items-grid">
        <div *ngFor="let item of items" class="item-card">
          <div class="badge" [class.lost]="item.type === 'LOST'">{{ item.type }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <div class="item-meta">
            <span><i class="bi bi-geo-alt"></i> {{ item.location }}</span>
            <span><i class="bi bi-calendar"></i> {{ item.dateTime }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lost-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header-section { text-align: center; margin-bottom: 3rem; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
    .item-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #eee; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; background: #2ecc71; color: white; display: inline-block; margin-bottom: 1rem; }
    .badge.lost { background: #e74c3c; }
    .item-meta { display: flex; gap: 1rem; color: #888; font-size: 0.9rem; margin-top: 1rem; }
  `]
})
export class LostListComponent implements OnInit {
  items: LostItem[] = [];

  constructor(private lostService: LostAndFoundService) { }

  ngOnInit() {
    this.lostService.getAllItems().subscribe(data => this.items = data);
  }
}
