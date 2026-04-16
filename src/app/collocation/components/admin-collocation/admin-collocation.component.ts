import { Component, inject, effect, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Home, 
  Users, 
  DollarSign, 
  MapPin, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Layout, 
  User as UserIcon,
  Layers
} from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { CollocationService } from '../../services/collocation.service';
import { CollocationOffer } from '../../models/collocationOffre.model';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../../user-security/services/user.service';
import { UserApiService } from '../../../user-security/services/user-api.service';

@Component({
  selector: 'app-admin-collocation',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DecimalPipe],
  template: `
    <section class="coloc-shell">
      <header class="coloc-header">
        <div>
          <span class="eyebrow">Admin Collocation</span>
          <h2>Annonces & Statistiques</h2>
          <p>Supervisez toutes les offres de collocation de la plateforme.</p>
        </div>
        <button class="btn btn-outline" (click)="loadAll()" [disabled]="loading">
          <lucide-icon [img]="RefreshIcon" [size]="16" class="me-2"></lucide-icon>
          {{ loading ? 'Actualisation…' : 'Actualiser' }}
        </button>
      </header>

      <div class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <lucide-icon [img]="HomeIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Total Annonces</span>
            <strong class="stat-value">{{ offers.length }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--green">
            <lucide-icon [img]="DollarSignIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Prix Moyen</span>
            <strong class="stat-value">{{ averagePrice | number:'1.0-0' }} DT</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <lucide-icon [img]="LayersIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Meublées</span>
            <strong class="stat-value">{{ furnishedCount }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--purple">
            <lucide-icon [img]="UsersIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Propriétaires</span>
            <strong class="stat-value">{{ uniqueOwnersCount }}</strong>
          </div>
        </article>
      </div>

      <div class="charts-grid">
        <article class="chart-card chart-card--wide">
          <header class="chart-head">
            <h4>Annonces par ville</h4>
            <span class="chart-sub">Répartition géographique</span>
          </header>
          <div class="chart-canvas-wrap">
            <canvas #cityChart></canvas>
          </div>
        </article>

        <article class="chart-card">
          <header class="chart-head">
            <h4>Type de logement</h4>
            <span class="chart-sub">Meublé vs Non-meublé</span>
          </header>
          <div class="chart-canvas-wrap chart-canvas-wrap--sm">
            <canvas #furnishedChart></canvas>
          </div>
        </article>

        <article class="chart-card">
          <header class="chart-head">
            <h4>Tranches de prix</h4>
            <span class="chart-sub">Répartition des loyers</span>
          </header>
          <div class="chart-canvas-wrap">
            <canvas #priceRangeChart></canvas>
          </div>
        </article>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <lucide-icon [img]="SearchIcon" [size]="16"></lucide-icon>
          <input type="text" placeholder="Rechercher par titre, ville ou propriétaire…" [(ngModel)]="search" />
        </div>
        <select [(ngModel)]="sortKey" class="select">
          <option value="id">Trier : Récent</option>
          <option value="prixLoc">Trier : Prix</option>
          <option value="ville">Trier : Ville</option>
        </select>
      </div>

      @if (loading) {
      <div class="empty">Chargement des annonces…</div>
      } @else if (error) {
      <div class="empty empty--error">{{ error }}</div>
      } @else if (filteredOffers.length === 0) {
      <div class="empty">Aucune annonce trouvée.</div>
      } @else {
      <article class="table-card">
        <table class="coloc-table">
          <thead>
            <tr>
              <th>Annonce</th>
              <th>Ville</th>
              <th>Prix</th>
              <th>Chambres</th>
              <th>Meublé</th>
              <th>Propriétaire</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (o of filteredOffers; track o.id) {
            <tr>
              <td>
                <div class="offer-info">
                  <span class="title">{{ o.titre }}</span>
                  <span class="subtitle">{{ o.description | slice:0:50 }}{{ o.description.length > 50 ? '...' : '' }}</span>
                </div>
              </td>
              <td>{{ o.ville }}</td>
              <td><strong>{{ o.prixLoc | number:'1.0-2' }} DT</strong></td>
              <td>{{ o.chambres }}</td>
              <td>
                <span class="status-pill" [ngClass]="o.meublee ? 'status-pill--success' : 'status-pill--neutral'">
                  {{ o.meublee ? 'Oui' : 'Non' }}
                </span>
              </td>
              <td>
                <div class="owner-cell">
                  <span class="name">{{ getOwnerProfile(o.ownerId).name }}</span>
                  <span class="email">{{ getOwnerProfile(o.ownerId).email }}</span>
                </div>
              </td>
              <td class="text-right">
                <div class="actions">
                  <button type="button" class="icon-btn" title="Voir les détails" (click)="viewDetail(o)">
                    <lucide-icon [img]="EyeIcon" [size]="16"></lucide-icon>
                  </button>
                  <button type="button" class="icon-btn icon-btn--danger" title="Supprimer" (click)="askDelete(o)">
                    <lucide-icon [img]="TrashIcon" [size]="16"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </article>
      }
    </section>

    <!-- Delete Confirmation Modal -->
    @if (deletingOffer) {
    <div class="modal-backdrop" (click)="cancelDelete()">
      <div class="modal-content modal-content--sm" (click)="$event.stopPropagation()">
        <div class="confirm-icon">
          <lucide-icon [img]="AlertIcon" [size]="32"></lucide-icon>
        </div>
        <h3>Supprimer cette annonce ?</h3>
        <p>
          Êtes-vous sûr de vouloir supprimer l'annonce <strong>"{{ deletingOffer.titre }}"</strong> ?
          Cette action est irréversible.
        </p>
        <footer class="modal-foot">
          <button class="btn btn-outline" (click)="cancelDelete()" [disabled]="isDeleting">Annuler</button>
          <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="isDeleting">
            {{ isDeleting ? 'Suppression…' : 'Oui, supprimer' }}
          </button>
        </footer>
      </div>
    </div>
    }
  `,
  styles: [`
    .coloc-shell { display: flex; flex-direction: column; gap: 1.5rem; }
    .coloc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .eyebrow { text-transform: uppercase; font-size: .75rem; letter-spacing: .08em; color: #6366f1; font-weight: 600; }
    .coloc-header h2 { font-size: 1.5rem; font-weight: 700; margin: .25rem 0; color: #0f172a; }
    .coloc-header p { color: #64748b; font-size: .875rem; margin: 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat-card { background: white; border-radius: 1rem; padding: 1.25rem; display: flex; gap: 1rem; align-items: center; box-shadow: 0 1px 3px rgb(0 0 0 / .05); }
    .stat-icon { width: 44px; height: 44px; border-radius: .75rem; display: flex; align-items: center; justify-content: center; color: white; }
    .stat-icon--blue { background: #3b82f6; }
    .stat-icon--green { background: #10b981; }
    .stat-icon--orange { background: #f59e0b; }
    .stat-icon--purple { background: #8b5cf6; }
    .stat-label { display: block; font-size: .75rem; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: #0f172a; }

    .charts-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1rem; }
    .chart-card { grid-column: span 6; background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgb(0 0 0 / .05); display: flex; flex-direction: column; gap: .75rem; }
    .chart-card--wide { grid-column: span 12; }
    @media (max-width: 900px) { .chart-card, .chart-card--wide { grid-column: span 12; } }
    .chart-head { display: flex; align-items: center; justify-content: space-between; }
    .chart-head h4 { margin: 0; font-size: .95rem; font-weight: 700; color: #0f172a; }
    .chart-sub { font-size: .75rem; color: #64748b; font-weight: 500; }
    .chart-canvas-wrap { position: relative; width: 100%; height: 240px; }
    .chart-canvas-wrap--sm { height: 220px; }

    .toolbar { display: flex; gap: .75rem; flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 240px; display: flex; align-items: center; gap: .5rem; background: white; padding: .625rem .875rem; border-radius: .75rem; border: 1px solid #e2e8f0; color: #64748b; }
    .search-box input { flex: 1; border: none; outline: none; font-size: .875rem; background: transparent; }
    .select { background: white; border: 1px solid #e2e8f0; border-radius: .75rem; padding: .625rem .875rem; font-size: .875rem; color: #0f172a; outline: none; }

    .table-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 3px rgb(0 0 0 / .05); }
    .coloc-table { width: 100%; border-collapse: collapse; }
    .coloc-table th { text-align: left; padding: .875rem 1rem; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: #64748b; background: #f8fafc; font-weight: 600; }
    .coloc-table td { padding: .875rem 1rem; border-top: 1px solid #f1f5f9; font-size: .875rem; color: #0f172a; }
    .coloc-table tr:hover td { background: #f8fafc; }
    .text-right { text-align: right; }

    .offer-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .offer-info .title { font-weight: 600; color: #0f172a; }
    .offer-info .subtitle { font-size: 0.75rem; color: #64748b; }

    .owner-cell { display: flex; flex-direction: column; gap: 0.125rem; }
    .owner-cell .name { font-weight: 500; color: #0f172a; }
    .owner-cell .email { font-size: 0.75rem; color: #64748b; }

    .status-pill { padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-pill--success { background: #dcfce7; color: #166534; }
    .status-pill--neutral { background: #f1f5f9; color: #475569; }

    .actions { display: inline-flex; gap: .25rem; }
    .icon-btn { background: transparent; border: 1px solid #e2e8f0; border-radius: .5rem; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all .15s; }
    .icon-btn:hover { background: #f1f5f9; }
    .icon-btn--danger:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

    .btn { display: inline-flex; align-items: center; gap: .5rem; padding: .625rem 1.125rem; border-radius: .75rem; font-size: .875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .15s; }
    .btn-outline { background: white; border-color: #e2e8f0; color: #0f172a; }
    .btn-outline:hover { background: #f8fafc; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }

    .empty { background: white; border-radius: 1rem; padding: 3rem; text-align: center; color: #64748b; }
    .empty--error { color: #dc2626; }

    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
    .modal-content { background: white; border-radius: 1rem; padding: 1.5rem; max-width: 520px; width: 100%; box-shadow: 0 25px 50px rgb(0 0 0 / .25); text-align: center; }
    .modal-content--sm { max-width: 440px; }
    .confirm-icon { width: 64px; height: 64px; border-radius: 9999px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
    .modal-content h3 { margin: 0 0 .5rem; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .modal-content p { color: #64748b; font-size: .875rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .modal-foot { display: flex; justify-content: center; gap: .75rem; }
  `]
})
export class AdminCollocationComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly service = inject(CollocationService);
  private readonly userService = inject(UserService);
  private readonly userApiService = inject(UserApiService);
  private readonly toast = inject(ToastService);

  readonly currentUser = this.userService.currentUser;

  readonly HomeIcon = Home;
  readonly UsersIcon = Users;
  readonly DollarSignIcon = DollarSign;
  readonly LayersIcon = Layers;
  readonly SearchIcon = Search;
  readonly TrashIcon = Trash2;
  readonly EyeIcon = Eye;
  readonly AlertIcon = AlertTriangle;
  readonly RefreshIcon = Clock;

  @ViewChild('cityChart') cityCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('furnishedChart') furnishedCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceRangeChart') priceRangeCanvas?: ElementRef<HTMLCanvasElement>;

  private cityChartRef?: Chart;
  private furnishedChartRef?: Chart;
  private priceRangeChartRef?: Chart;

  offers: CollocationOffer[] = [];
  loading = false;
  error = '';
  search = '';
  sortKey: keyof CollocationOffer = 'id';

  ownerProfiles = new Map<number, { name: string, email: string }>();
  deletingOffer: CollocationOffer | null = null;
  isDeleting = false;

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    if (this.offers.length > 0) {
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  ngOnDestroy(): void {
    this.cityChartRef?.destroy();
    this.furnishedChartRef?.destroy();
    this.priceRangeChartRef?.destroy();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    this.service.getAllOffers().subscribe({
      next: (data) => {
        this.offers = data || [];
        this.loading = false;
        this.preloadOwnerNames();
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err) => {
        this.error = 'Impossible de charger les annonces.';
        this.loading = false;
        this.toast.error(this.error);
      }
    });
  }

  get filteredOffers(): CollocationOffer[] {
    let result = [...this.offers];
    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(o => 
        o.titre.toLowerCase().includes(q) || 
        o.ville.toLowerCase().includes(q) ||
        this.getOwnerProfile(o.ownerId).name.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (a[this.sortKey]! < b[this.sortKey]!) return this.sortKey === 'id' ? 1 : -1;
      if (a[this.sortKey]! > b[this.sortKey]!) return this.sortKey === 'id' ? -1 : 1;
      return 0;
    });
  }

  get averagePrice(): number {
    if (this.offers.length === 0) return 0;
    return this.offers.reduce((acc, o) => acc + (o.prixLoc || 0), 0) / this.offers.length;
  }

  get furnishedCount(): number {
    return this.offers.filter(o => o.meublee).length;
  }

  get uniqueOwnersCount(): number {
    return new Set(this.offers.map(o => o.ownerId)).size;
  }

  private preloadOwnerNames(): void {
    const uniqueIds = [...new Set(this.offers.map(o => o.ownerId))];
    uniqueIds.forEach(id => {
      if (!this.ownerProfiles.has(id)) {
        this.userApiService.getUserById(String(id)).then(profile => {
          const name = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : `User #${id}`;
          const email = profile?.email || 'N/A';
          this.ownerProfiles.set(id, { name: name || `User #${id}`, email });
        }).catch(() => {
          this.ownerProfiles.set(id, { name: `User #${id}`, email: 'N/A' });
        });
      }
    });
  }

  getOwnerProfile(id: number): { name: string, email: string } {
    return this.ownerProfiles.get(id) || { name: '...', email: '...' };
  }

  private renderCharts(): void {
    this.renderCityChart();
    this.renderFurnishedChart();
    this.renderPriceRangeChart();
  }

  private renderCityChart(): void {
    if (!this.cityCanvas?.nativeElement) return;
    const cityData = new Map<string, number>();
    this.offers.forEach(o => cityData.set(o.ville, (cityData.get(o.ville) || 0) + 1));
    const sorted = [...cityData.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    this.cityChartRef?.destroy();
    this.cityChartRef = new Chart(this.cityCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          label: 'Annonces',
          data: sorted.map(s => s[1]),
          backgroundColor: '#6366f1',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  private renderFurnishedChart(): void {
    if (!this.furnishedCanvas?.nativeElement) return;
    const furnished = this.furnishedCount;
    const unfurnished = this.offers.length - furnished;

    this.furnishedChartRef?.destroy();
    this.furnishedChartRef = new Chart(this.furnishedCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Meublé', 'Non-meublé'],
        datasets: [{
          data: [furnished, unfurnished],
          backgroundColor: ['#10b981', '#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  private renderPriceRangeChart(): void {
    if (!this.priceRangeCanvas?.nativeElement) return;
    const ranges = [
      { label: '< 200', min: 0, max: 200 },
      { label: '200-400', min: 200, max: 400 },
      { label: '400-600', min: 400, max: 600 },
      { label: '600-1000', min: 600, max: 1000 },
      { label: '> 1000', min: 1000, max: Infinity }
    ];
    const data = ranges.map(r => this.offers.filter(o => o.prixLoc >= r.min && o.prixLoc < r.max).length);

    this.priceRangeChartRef?.destroy();
    this.priceRangeChartRef = new Chart(this.priceRangeCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ranges.map(r => r.label),
        datasets: [{
          label: 'Nombre d\'annonces',
          data: data,
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  viewDetail(offer: CollocationOffer): void {
    // Navigate or open modal (simplification: we just log or use window for now if no route exists)
    // Actually, following covoiturage pattern, they open a modal.
    this.toast.info('Consultation de l\'annonce : ' + offer.titre);
  }

  askDelete(offer: CollocationOffer): void {
    this.deletingOffer = offer;
  }

  cancelDelete(): void {
    this.deletingOffer = null;
  }

  confirmDelete(): void {
    if (!this.deletingOffer) return;
    this.isDeleting = true;
    this.service.deleteOffer(this.deletingOffer.id).subscribe({
      next: () => {
        this.toast.success('Annonce supprimée avec succès.');
        this.offers = this.offers.filter(o => o.id !== this.deletingOffer?.id);
        this.deletingOffer = null;
        this.isDeleting = false;
        this.renderCharts();
      },
      error: () => {
        this.toast.error('Erreur lors de la suppression.');
        this.isDeleting = false;
      }
    });
  }
}
