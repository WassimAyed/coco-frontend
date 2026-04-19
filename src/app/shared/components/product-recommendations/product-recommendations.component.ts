import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShieldCheck, Tag } from 'lucide-angular';
import { CloudinaryService } from '../../services/cloudinary.service';

interface Recommendation {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  category: string;
  conditionLabel: string;
}

const BASE = 'https://res.cloudinary.com/dyap1f7ka/image/upload';

const RECS_POOL: Recommendation[] = [
  { id: 101, title: 'Table salon bois massif', price: 180,
    imageUrl: `${BASE}/coco-market/table-manger-premium.jpg`,
    category: 'Salon', conditionLabel: 'Bon etat' },
  { id: 102, title: 'Chaise ergonomique bureau', price: 220,
    imageUrl: `${BASE}/coco-market/chaise-ergonomique-usage-pro.jpg`,
    category: 'Bureau', conditionLabel: 'Usage pro' },
  { id: 103, title: 'Etagere design 5 niveaux', price: 95,
    imageUrl: `${BASE}/coco-market/etagere-design-5n.jpg`,
    category: 'Bureau', conditionLabel: 'Bon etat' },
  { id: 104, title: 'Canape convertible 2 places', price: 450,
    imageUrl: `${BASE}/coco-market/canape-convertible-bon-etat.jpg`,
    category: 'Salon', conditionLabel: 'Bon etat' },
  { id: 105, title: 'Lit simple 90x190 cm', price: 320,
    imageUrl: `${BASE}/coco-market/lit-simple-neuf.jpg`,
    category: 'Chambre', conditionLabel: 'Neuf' },
  { id: 106, title: 'Bureau compact pliant', price: 145,
    imageUrl: `${BASE}/coco-market/bureau-compact-pliant.jpg`,
    category: 'Bureau', conditionLabel: 'Bon etat' },
  { id: 107, title: 'Armoire 3 portes miroir', price: 390,
    imageUrl: `${BASE}/coco-market/armoire-3portes-miroir.jpg`,
    category: 'Chambre', conditionLabel: 'Neuf' },
  { id: 108, title: 'Table a manger 6 personnes', price: 520,
    imageUrl: `${BASE}/coco-market/table-manger-premium.jpg`,
    category: 'Cuisine', conditionLabel: 'Premium' },
];

@Component({
  selector: 'app-product-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './product-recommendations.component.html',
  styleUrls: ['./product-recommendations.component.scss'],
})
export class ProductRecommendationsComponent implements OnInit {
  readonly currentId = input<number>(0);
  recommendations: Recommendation[] = [];

  readonly ShieldCheck = ShieldCheck;
  readonly Tag = Tag;

  constructor(private cloudinary: CloudinaryService) {}

  ngOnInit(): void {
    const shuffled = [...RECS_POOL]
      .filter(r => r.id !== this.currentId())
      .sort(() => Math.random() - 0.5);
    this.recommendations = shuffled.slice(0, 4);
  }

  optimizedImg(url: string): string {
    return this.cloudinary.getOptimizedUrl(url, 280, 200);
  }
}