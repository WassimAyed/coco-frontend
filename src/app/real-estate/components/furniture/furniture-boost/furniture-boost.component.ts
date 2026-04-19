import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, CreditCard, Truck, Wallet, Zap, Check } from 'lucide-angular';
import { FurnitureService } from '../../../services/furniture.service';
import { BoostService } from '../../../services/boost.service';
import { BoostAnalysis } from '../../../models/boost.model';

@Component({
  selector: 'app-furniture-boost',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './furniture-boost.component.html',
  styleUrls: ['./furniture-boost.component.scss']
})
export class FurnitureBoostComponent implements OnInit {

  furniture: any = null;
  analysis: BoostAnalysis | null = null;
  selectedDuration = 0;
  loading = false;
  analyzing = false;
  boosted = false;
  success = false;
  alreadyBoosted = false;
  selectedPayment = signal<string | null>(null);

  readonly CreditCard = CreditCard;
  readonly Truck = Truck;
  readonly Wallet = Wallet;
  readonly Zap = Zap;
  readonly Check = Check;

  paymentMethods = [
    { key: 'flouci', name: 'Flouci', desc: 'Paiement mobile instantané', icon: Wallet },
    { key: 'd17',    name: 'D17',    desc: 'Paiement via carte D17',     icon: CreditCard },
  ];

  plans = [
    { days: 1, price: 9.9, label: '1 Jour', icon: '⚡', desc: 'Boost express' },
    { days: 3, price: 24.9, label: '3 Jours', icon: '🔥', desc: 'Meilleur rapport' },
    { days: 7, price: 49.9, label: '7 Jours', icon: '🚀', desc: 'Visibilité maximale' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private furnitureService: FurnitureService,
    private boostService: BoostService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.furnitureService.getById(id).subscribe({
      next: (f) => {
        this.furniture = f;
        this.checkBoosted(id);
        this.analyzeWithAI();
      }
    });
  }

  checkBoosted(id: number): void {
    this.boostService.isBoosted(id).subscribe({
      next: (res) => { this.alreadyBoosted = res.boosted; }
    });
  }

  async analyzeWithAI(): Promise<void> {
    if (!this.furniture) return;
    this.analyzing = true;
    try {
      this.analysis = await this.boostService.analyzeWithAI(this.furniture);
      if (this.analysis?.recommendedDuration) {
        this.selectedDuration = this.analysis.recommendedDuration;
      }
    } catch (e) {
      console.error('IA error:', e);
    }
    this.analyzing = false;
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  }

  getScoreLabel(score: number): string {
    if (score >= 70) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  }

  get selectedPrice(): number {
    return this.plans.find(p => p.days === this.selectedDuration)?.price ?? 0;
  }

  selectPlan(days: number): void {
    this.selectedDuration = days;
  }

  selectPayment(method: string): void {
    this.selectedPayment.set(method);
  }

  boost(): void {
    if (!this.selectedDuration || !this.furniture || !this.selectedPayment()) return;
    this.loading = true;
    this.boostService.create({
      furnitureId: this.furniture.id,
      sellerId: 1,
      durationDays: this.selectedDuration
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  goBack(): void {
    this.router.navigate(['/furniture', this.furniture.id]);
  }
}
