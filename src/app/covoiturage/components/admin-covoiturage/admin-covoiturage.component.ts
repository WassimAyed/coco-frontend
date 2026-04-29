import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, inject, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Car, Users, DollarSign, MapPin, Search, Trash2, Edit, Eye, X, CheckCircle, XCircle, Clock, AlertTriangle, Calendar, Route, User as UserIcon } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { CovoiturageService } from '../../services/covoiturage.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { Covoiturage, Reservation } from '../../models/covoiturage.model';
import { ToastService } from '../../../shared/services/toast.service';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-admin-covoiturage',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <section class="cov-shell">
      <header class="cov-header">
        <div>
          <span class="eyebrow">Admin Covoiturage</span>
          <h2>Trajets & Réservations</h2>
          <p>Supervisez tous les trajets de covoiturage de la plateforme.</p>
        </div>
        <button class="btn btn-outline" (click)="loadAll()" [disabled]="loading">
          {{ loading ? 'Actualisation…' : 'Actualiser' }}
        </button>
      </header>

      <div class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <lucide-icon [img]="CarIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Total trajets</span>
            <strong class="stat-value">{{ adminStats?.totalTrajets ?? covoiturages.length }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--green">
            <lucide-icon [img]="UsersIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Conducteurs actifs</span>
            <strong class="stat-value">{{ adminStats?.conducteursActifs ?? uniqueDriversCount }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <lucide-icon [img]="MapPinIcon" [size]="22"></lucide-icon>
          </div>
          <div>
            <span class="stat-label">Places disponibles</span>
            <strong class="stat-value">{{ adminStats?.placesDisponibles ?? totalSeatsAvailable }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--green">
            <i class="fas fa-leaf" style="font-size:22px;"></i>
          </div>
          <div>
            <span class="stat-label">CO2 économisé</span>
            <strong class="stat-value">{{ totalCO2Saved | number:'1.0-1' }} kg</strong>
          </div>
        </article>
      </div>

      <div class="charts-grid">
        <article class="chart-card chart-card--wide">
          <header class="chart-head">
            <h4>Trajets par jour</h4>
            <span class="chart-sub">7 derniers jours</span>
          </header>
          <div class="chart-canvas-wrap">
            <canvas #tripsPerDayChart></canvas>
          </div>
        </article>

        <article class="chart-card">
          <header class="chart-head">
            <h4>Occupation des places</h4>
            <span class="chart-sub">{{ seatsTaken }} / {{ seatsTotal }}</span>
          </header>
          <div class="chart-canvas-wrap chart-canvas-wrap--sm">
            <canvas #occupancyChart></canvas>
          </div>
        </article>

        <article class="chart-card">
          <header class="chart-head">
            <h4>Trajets les plus fréquents</h4>
            <span class="chart-sub">Par nombre de trajets</span>
          </header>
          <div class="chart-canvas-wrap">
            <canvas #topRoutesChart></canvas>
          </div>
        </article>

        <article class="chart-card">
          <header class="chart-head">
            <h4>Répartition des prix</h4>
            <span class="chart-sub">DT par passager</span>
          </header>
          <div class="chart-canvas-wrap">
            <canvas #priceDistChart></canvas>
          </div>
        </article>

        <article class="chart-card chart-card--wide">
          <header class="chart-head">
            <h4><i class="fas fa-leaf" style="color:#16a34a;margin-right:.375rem;"></i>CO2 économisé par jour</h4>
            <span class="chart-sub">7 derniers jours · total : {{ co2Saved7Days | number:'1.0-1' }} kg</span>
          </header>
          <div class="chart-canvas-wrap">
            <canvas #co2Chart></canvas>
          </div>
        </article>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <lucide-icon [img]="SearchIcon" [size]="16"></lucide-icon>
          <input type="text" placeholder="Rechercher par ville ou conducteur…" [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
        </div>
        <select [(ngModel)]="sortKey" (ngModelChange)="onSortChange()" class="select">
          <option value="dateDepart">Trier : Date</option>
          <option value="prixParPassager">Trier : Prix</option>
          <option value="distance">Trier : Distance</option>
        </select>
      </div>

      @if (loading) {
      <div class="empty">Chargement des trajets…</div>
      } @else if (error) {
      <div class="empty empty--error">{{ error }}</div>
      } @else if (filteredCovoiturages.length === 0) {
      <div class="empty">Aucun trajet trouvé.</div>
      } @else {
      <article class="table-card">
        <table class="cov-table">
          <thead>
            <tr>
              <th>Trajet</th>
              <th>Date</th>
              <th>Conducteur</th>
              <th>Places</th>
              <th>Prix</th>
              <th>Prix IA</th>
              <th>Distance</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (c of paginatedCovoiturages; track c.id) {
            <tr>
              <td>
                <div class="route">
                  <span class="point">{{ c.pointDepart }}</span>
                  <span class="arrow">→</span>
                  <span class="point">{{ c.pointArrivee }}</span>
                </div>
              </td>
              <td>{{ c.dateDepart | date:'dd MMM yyyy, HH:mm' }}</td>
              <td>{{ getDriverName(c.idDriver) }}</td>
              <td>
                <span class="chip">{{ c.placesDisponibles }}/{{ c.nombrePlaces }}</span>
              </td>
              <td>{{ c.prixParPassager | number:'1.0-2' }} DT</td>
              <td>
                <span *ngIf="c.prixSuggereParAI != null; else noAI" class="chip chip--ai">
                  {{ c.prixSuggereParAI | number:'1.0-2' }} DT
                </span>
                <ng-template #noAI><span class="mono">—</span></ng-template>
              </td>
              <td>{{ c.distance | number:'1.0-1' }} km</td>
              <td class="text-right">
                <div class="actions">
                  <button type="button" class="icon-btn" title="Voir les détails" (click)="openDetail(c)">
                    <lucide-icon [img]="EyeIcon" [size]="16"></lucide-icon>
                  </button>
                  <button type="button" class="icon-btn" title="Modifier" (click)="openEdit(c)">
                    <lucide-icon [img]="EditIcon" [size]="16"></lucide-icon>
                  </button>
                  <button type="button" class="icon-btn icon-btn--danger" title="Supprimer" (click)="askDelete(c)">
                    <lucide-icon [img]="TrashIcon" [size]="16"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </article>

      @if (totalPages > 1) {
      <nav class="pagination">
        <button class="page-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
          ‹ Précédent
        </button>
        @for (p of pageNumbers; track p) {
          <button class="page-btn" [class.page-btn--active]="p === currentPage" (click)="goToPage(p)">
            {{ p }}
          </button>
        }
        <button class="page-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
          Suivant ›
        </button>
        <span class="page-info">
          Page {{ currentPage }} / {{ totalPages }} — {{ filteredCovoiturages.length }} trajet(s)
        </span>
      </nav>
      }
      }
    </section>

    @if (editing) {
    <div class="cov-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;" (click)="closeEdit()">
      <div class="cov-modal cov-modal--xl" style="display:block;background:white;border-radius:1rem;max-width:820px;width:100%;padding:0;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.25);position:relative;" (click)="$event.stopPropagation()">
        <div class="card border-0 rounded-4">
          <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between mb-4">
              <h3 class="fw-bold mb-0">
                <i class="fas fa-edit text-warning me-2"></i> Modifier le trajet
              </h3>
              <button type="button" class="btn-close" (click)="closeEdit()"></button>
            </div>

            <form (ngSubmit)="saveEdit()">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">
                    <i class="fas fa-map-marker-alt text-success me-1"></i> Point de départ *
                  </label>
                  <input #editDepartInput type="text" class="form-control" placeholder="Rechercher un lieu..." [(ngModel)]="editing.pointDepart" name="editDepart" required>
                  <small *ngIf="editing.lattitudeDepart" class="text-success">
                    <i class="fas fa-check-circle me-1"></i> {{ editing.pointDepart }}
                  </small>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold">
                    <i class="fas fa-map-marker-alt text-danger me-1"></i> Point d'arrivée *
                  </label>
                  <input #editArriveeInput type="text" class="form-control" placeholder="Rechercher un lieu..." [(ngModel)]="editing.pointArrivee" name="editArrivee" required>
                  <small *ngIf="editing.latitudeArrivee" class="text-success">
                    <i class="fas fa-check-circle me-1"></i> {{ editing.pointArrivee }}
                  </small>
                </div>

                <div class="col-md-12">
                  <div #editMap class="rounded-3 border" style="width: 100%; height: 350px;"></div>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold">
                    <i class="fas fa-road text-info me-1"></i> Distance (km)
                  </label>
                  <input type="number" class="form-control bg-light" [ngModel]="editing.distance" name="editDistance" readonly>
                  <small class="text-muted">Calculée automatiquement</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">
                    <i class="fas fa-clock text-info me-1"></i> Durée estimée (min)
                  </label>
                  <input type="number" class="form-control bg-light" [ngModel]="editing.dureeEstimee" name="editDuree" readonly>
                  <small class="text-muted">Calculée automatiquement</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold">Date de départ *</label>
                  <input type="datetime-local" class="form-control" [(ngModel)]="editing.dateDepart" name="editDateDepart" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Nombre de places</label>
                  <input type="number" class="form-control" [(ngModel)]="editing.nombrePlaces" name="editNombrePlaces" min="1">
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold">Places disponibles</label>
                  <input type="number" class="form-control" [(ngModel)]="editing.placesDisponibles" name="editPlacesDispo" min="0">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Prix par passager (TND)</label>
                  <input type="number" class="form-control" [(ngModel)]="editing.prixParPassager" name="editPrix" min="0" step="0.5">
                </div>
              </div>

              <div class="mt-4 d-flex gap-2 justify-content-end">
                <button type="button" class="btn btn-outline-secondary rounded-pill px-4" (click)="closeEdit()">Annuler</button>
                <button type="submit" class="btn btn-warning rounded-pill px-4" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!saving" class="fas fa-save me-1"></i>
                  {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    }

    @if (viewingDetail) {
    <div class="cov-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;" (click)="closeDetail()">
      <div class="cov-modal cov-modal--xl" style="display:block;background:white;border-radius:1rem;max-width:900px;width:100%;padding:1.5rem;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.25);position:relative;" (click)="$event.stopPropagation()">
        <header class="modal-head">
          <div>
            <span class="eyebrow">Détails du trajet</span>
            <h3>{{ viewingDetail.pointDepart }} → {{ viewingDetail.pointArrivee }}</h3>
          </div>
          <button class="icon-btn" (click)="closeDetail()">
            <lucide-icon [img]="CloseIcon" [size]="18"></lucide-icon>
          </button>
        </header>

        <div #detailMap class="detail-map"></div>

        <div class="detail-grid">
          <div class="info-tile">
            <lucide-icon [img]="CalendarIcon" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Départ</span>
              <strong>{{ viewingDetail.dateDepart | date:'dd MMM yyyy, HH:mm' }}</strong>
            </div>
          </div>
          <div class="info-tile">
            <lucide-icon [img]="UserIconRef" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Conducteur</span>
              <strong>{{ getDriverName(viewingDetail.idDriver) }}</strong>
            </div>
          </div>
          <div class="info-tile">
            <lucide-icon [img]="UsersIcon" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Places</span>
              <strong>{{ viewingDetail.placesDisponibles }} / {{ viewingDetail.nombrePlaces }}</strong>
            </div>
          </div>
          <div class="info-tile">
            <lucide-icon [img]="DollarSignIcon" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Prix / passager</span>
              <strong>{{ viewingDetail.prixParPassager | number:'1.0-2' }} DT</strong>
            </div>
          </div>
          <div class="info-tile info-tile--ai" *ngIf="viewingDetail.prixSuggereParAI != null">
            <lucide-icon [img]="DollarSignIcon" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Prix suggeré IA</span>
              <strong>{{ viewingDetail.prixSuggereParAI | number:'1.0-2' }} DT</strong>
              <span class="ai-delta" [class.ai-delta--over]="getPriceDelta(viewingDetail) > 0" [class.ai-delta--under]="getPriceDelta(viewingDetail) < 0">
                {{ getPriceDelta(viewingDetail) > 0 ? '+' : '' }}{{ getPriceDelta(viewingDetail) | number:'1.0-2' }} DT vs prix choisi
              </span>
            </div>
          </div>
          <div class="info-tile">
            <lucide-icon [img]="RouteIcon" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Distance</span>
              <strong>{{ viewingDetail.distance | number:'1.0-1' }} km</strong>
            </div>
          </div>
          <div class="info-tile">
            <lucide-icon [img]="ClockIcon" [size]="18"></lucide-icon>
            <div>
              <span class="info-label">Durée</span>
              <strong>{{ viewingDetail.dureeEstimee }} min</strong>
            </div>
          </div>
        </div>

        <section class="detail-section">
          <h4>Réservations ({{ reservations.length }})</h4>
          @if (reservationsLoading) {
          <div class="empty">Chargement des réservations…</div>
          } @else if (reservations.length === 0) {
          <div class="empty">Aucune réservation pour ce trajet.</div>
          } @else {
          <table class="cov-table">
            <thead>
              <tr>
                <th>Passager</th>
                <th>Places</th>
                <th>Date</th>
                <th>Statut</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (r of reservations; track r.id) {
              <tr>
                <td>{{ getPassengerName(r.idPassenger) }}</td>
                <td>{{ r.nbPassengers }}</td>
                <td>{{ r.dateReservation | date:'dd MMM yyyy' }}</td>
                <td>
                  <span class="status" [class]="'status--' + r.statusReservation.toLowerCase()">
                    {{ r.statusReservation }}
                  </span>
                </td>
                <td class="text-right">
                  <button class="icon-btn icon-btn--danger" title="Supprimer" (click)="deleteReservation(r)">
                    <lucide-icon [img]="TrashIcon" [size]="16"></lucide-icon>
                  </button>
                </td>
              </tr>
              }
            </tbody>
          </table>
          }
        </section>
      </div>
    </div>
    }

    @if (deleting) {
    <div class="cov-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;" (click)="cancelDelete()">
      <div class="cov-modal cov-modal--sm" style="display:block;background:white;border-radius:1rem;max-width:440px;width:100%;padding:1.5rem;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.25);position:relative;" (click)="$event.stopPropagation()">
        <div class="confirm-body">
          <div class="confirm-icon">
            <lucide-icon [img]="AlertIcon" [size]="28"></lucide-icon>
          </div>
          <h3>Supprimer ce trajet ?</h3>
          <p>
            Cette action supprimera définitivement le trajet de
            <strong>{{ deleting.pointDepart }}</strong> vers
            <strong>{{ deleting.pointArrivee }}</strong> ainsi que toutes ses réservations. Cette action est irréversible.
          </p>
        </div>
        <footer class="modal-foot">
          <button class="btn btn-outline" (click)="cancelDelete()" [disabled]="deletingInProgress">Annuler</button>
          <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="deletingInProgress">
            {{ deletingInProgress ? 'Suppression…' : 'Oui, supprimer' }}
          </button>
        </footer>
      </div>
    </div>
    }
  `,
  styles: [`
    .cov-shell { display: flex; flex-direction: column; gap: 1.5rem; }
    .cov-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .eyebrow { text-transform: uppercase; font-size: .75rem; letter-spacing: .08em; color: #6366f1; font-weight: 600; }
    .cov-header h2 { font-size: 1.5rem; font-weight: 700; margin: .25rem 0; color: #0f172a; }
    .cov-header p { color: #64748b; font-size: .875rem; margin: 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .charts-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1rem; }
    .chart-card { grid-column: span 6; background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgb(0 0 0 / .05); display: flex; flex-direction: column; gap: .75rem; }
    .chart-card--wide { grid-column: span 12; }
    @media (max-width: 900px) { .chart-card, .chart-card--wide { grid-column: span 12; } }
    .chart-head { display: flex; align-items: center; justify-content: space-between; }
    .chart-head h4 { margin: 0; font-size: .95rem; font-weight: 700; color: #0f172a; }
    .chart-sub { font-size: .75rem; color: #64748b; font-weight: 500; }
    .chart-canvas-wrap { position: relative; width: 100%; height: 240px; }
    .chart-canvas-wrap--sm { height: 220px; }
    .stat-card { background: white; border-radius: 1rem; padding: 1.25rem; display: flex; gap: 1rem; align-items: center; box-shadow: 0 1px 3px rgb(0 0 0 / .05); }
    .stat-icon { width: 44px; height: 44px; border-radius: .75rem; display: flex; align-items: center; justify-content: center; color: white; }
    .stat-icon--blue { background: #3b82f6; }
    .stat-icon--green { background: #10b981; }
    .stat-icon--orange { background: #f59e0b; }
    .stat-icon--purple { background: #8b5cf6; }
    .stat-label { display: block; font-size: .75rem; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: #0f172a; }

    .toolbar { display: flex; gap: .75rem; flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 240px; display: flex; align-items: center; gap: .5rem; background: white; padding: .625rem .875rem; border-radius: .75rem; border: 1px solid #e2e8f0; color: #64748b; }
    .search-box input { flex: 1; border: none; outline: none; font-size: .875rem; background: transparent; }
    .select { background: white; border: 1px solid #e2e8f0; border-radius: .75rem; padding: .625rem .875rem; font-size: .875rem; color: #0f172a; }

    .table-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 3px rgb(0 0 0 / .05); }
    .cov-table { width: 100%; border-collapse: collapse; }
    .cov-table th { text-align: left; padding: .875rem 1rem; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: #64748b; background: #f8fafc; font-weight: 600; }
    .cov-table td { padding: .875rem 1rem; border-top: 1px solid #f1f5f9; font-size: .875rem; color: #0f172a; }
    .cov-table tr:hover td { background: #f8fafc; }
    .mono { font-family: ui-monospace, monospace; color: #64748b; }
    .text-right { text-align: right; }

    .route { display: flex; align-items: center; gap: .5rem; }
    .point { font-weight: 500; }
    .arrow { color: #94a3b8; }
    .chip { background: #eff6ff; color: #1d4ed8; padding: .125rem .5rem; border-radius: 9999px; font-size: .75rem; font-weight: 600; }
    .chip--ai { background: #ede9fe; color: #7c3aed; }

    .actions { display: inline-flex; gap: .25rem; }
    .icon-btn { background: transparent; border: 1px solid #e2e8f0; border-radius: .5rem; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all .15s; }
    .icon-btn:hover { background: #f1f5f9; }
    .icon-btn lucide-icon, .icon-btn svg { pointer-events: none; }
    .icon-btn--danger { color: #dc2626; }
    .icon-btn--danger:hover { background: #fee2e2; border-color: #fca5a5; }

    .btn { display: inline-flex; align-items: center; gap: .5rem; padding: .625rem 1.125rem; border-radius: .75rem; font-size: .875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .15s; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-outline { background: white; border-color: #e2e8f0; color: #0f172a; }
    .btn-outline:hover:not(:disabled) { background: #f8fafc; }

    .empty { background: white; border-radius: 1rem; padding: 3rem; text-align: center; color: #64748b; }
    .empty--error { color: #dc2626; }

    .pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .375rem; padding: .5rem 0; }
    .page-btn { background: white; border: 1px solid #e2e8f0; border-radius: .5rem; padding: .5rem .875rem; font-size: .875rem; font-weight: 600; color: #475569; cursor: pointer; transition: all .15s; min-width: 40px; }
    .page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-btn--active { background: #6366f1; border-color: #6366f1; color: white; }
    .page-btn--active:hover:not(:disabled) { background: #4f46e5; border-color: #4f46e5; }
    .page-info { margin-left: .75rem; font-size: .75rem; color: #64748b; }

    .cov-modal-backdrop { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(15, 23, 42, 0.55); display: flex !important; align-items: center; justify-content: center; z-index: 9999 !important; padding: 1rem; }
    .cov-modal { display: block !important; background: white; border-radius: 1rem; max-width: 520px; width: 100%; padding: 1.5rem; box-shadow: 0 25px 50px rgb(0 0 0 / .25); max-height: 90vh; overflow-y: auto; position: relative; }
    .cov-modal--wide { max-width: 760px; }
    .cov-modal--xl { max-width: 900px; }
    .cov-modal--sm { max-width: 440px; }
    .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-head h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .modal-foot { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.5rem; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: .375rem; }
    .field.full { grid-column: 1 / -1; }
    .field span { font-size: .75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
    .field input { padding: .625rem .75rem; border: 1px solid #e2e8f0; border-radius: .5rem; font-size: .875rem; outline: none; }
    .field input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgb(99 102 241 / .15); }

    .status { padding: .125rem .625rem; border-radius: 9999px; font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .status--en_attente { background: #fef3c7; color: #b45309; }
    .status--confirmee { background: #dcfce7; color: #166534; }
    .status--refusee { background: #fee2e2; color: #991b1b; }

    .detail-map { width: 100%; height: 320px; border-radius: .75rem; background: #f1f5f9; margin-bottom: 1.25rem; overflow: hidden; }
    .edit-map { width: 100%; height: 260px; border-radius: .75rem; background: #f1f5f9; overflow: hidden; margin-top: .375rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .75rem; margin-bottom: 1.5rem; }
    .info-tile { background: #f8fafc; border-radius: .75rem; padding: .875rem 1rem; display: flex; align-items: center; gap: .75rem; color: #475569; }
    .info-tile lucide-icon { color: #6366f1; }
    .info-label { display: block; font-size: .7rem; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
    .info-tile strong { display: block; color: #0f172a; font-size: .875rem; font-weight: 600; }
    .info-tile--ai { background: linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%); }
    .info-tile--ai lucide-icon { color: #8b5cf6; }
    .ai-delta { display: block; font-size: .7rem; font-weight: 600; margin-top: .125rem; }
    .ai-delta--over { color: #dc2626; }
    .ai-delta--under { color: #16a34a; }
    .detail-section h4 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 .75rem 0; }

    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }

    .confirm-body { text-align: center; padding: .5rem 0 1rem; }
    .confirm-icon { width: 64px; height: 64px; border-radius: 9999px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .confirm-body h3 { margin: 0 0 .5rem; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .confirm-body p { margin: 0; color: #64748b; font-size: .875rem; line-height: 1.5; }
  `]
})
export class AdminCovoiturageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly service = inject(CovoiturageService);
  private readonly toast = inject(ToastService);
  private readonly mapsLoader = inject(GoogleMapsLoaderService);
  private readonly ngZone = inject(NgZone);
  private readonly http = inject(HttpClient);

  readonly CarIcon = Car;
  readonly UsersIcon = Users;
  readonly DollarSignIcon = DollarSign;
  readonly MapPinIcon = MapPin;
  readonly SearchIcon = Search;
  readonly TrashIcon = Trash2;
  readonly EditIcon = Edit;
  readonly EyeIcon = Eye;
  readonly CloseIcon = X;
  readonly CheckIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly AlertIcon = AlertTriangle;
  readonly CalendarIcon = Calendar;
  readonly RouteIcon = Route;
  readonly UserIconRef = UserIcon;

  @ViewChild('tripsPerDayChart') tripsPerDayCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('occupancyChart') occupancyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('topRoutesChart') topRoutesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceDistChart') priceDistCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('co2Chart') co2Canvas?: ElementRef<HTMLCanvasElement>;
  private tripsPerDayChartRef?: Chart;
  private occupancyChartRef?: Chart;
  private topRoutesChartRef?: Chart;
  private priceDistChartRef?: Chart;
  private co2ChartRef?: Chart;

  @ViewChild('detailMap') detailMapEl?: ElementRef<HTMLDivElement>;
  @ViewChild('editMap') editMapEl?: ElementRef<HTMLDivElement>;
  @ViewChild('editDepartInput') editDepartInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('editArriveeInput') editArriveeInputEl?: ElementRef<HTMLInputElement>;
  private map: any;
  private editMap: any;
  private editDirectionsService: any;
  private editDirectionsRenderer: any;
  private editDepartMarker: any;
  private editArriveeMarker: any;

  covoiturages: Covoiturage[] = [];
  loading = false;
  error = '';
  search = '';
  sortKey: 'dateDepart' | 'prixParPassager' | 'distance' = 'dateDepart';

  currentPage = 1;
  readonly pageSize = 5;

  editing: Covoiturage | null = null;
  saving = false;

  viewingDetail: Covoiturage | null = null;
  reservations: Reservation[] = [];
  reservationsLoading = false;

  deleting: Covoiturage | null = null;
  deletingInProgress = false;

  driverNames = new Map<number, string>();
  passengerNames = new Map<number, string>();

  adminStats: { totalTrajets: number; conducteursActifs: number; placesDisponibles: number } | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAdminStats(): void {
    this.service.getAdminStats().subscribe({
      next: (stats) => this.adminStats = stats,
      error: (err) => console.error('Erreur chargement stats admin', err)
    });
  }

  ngAfterViewInit(): void {
    if (this.covoiturages.length > 0) {
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  ngOnDestroy(): void {
    this.tripsPerDayChartRef?.destroy();
    this.occupancyChartRef?.destroy();
    this.topRoutesChartRef?.destroy();
    this.priceDistChartRef?.destroy();
    this.co2ChartRef?.destroy();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    this.service.getAllCovoiturages().subscribe({
      next: (data) => {
        this.covoiturages = data || [];
        this.loading = false;
        this.preloadDriverNames(this.covoiturages.map((c) => c.idDriver));
        this.loadAdminStats();
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger les trajets.';
        this.loading = false;
      }
    });
  }

  get seatsTotal(): number {
    return this.covoiturages.reduce((acc, c) => acc + (c.nombrePlaces || 0), 0);
  }

  get seatsTaken(): number {
    return this.seatsTotal - this.totalSeatsAvailable;
  }

  private getTripsPerDay(): { labels: string[]; counts: number[] } {
    const days: { label: string; key: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' });
      days.push({ label, key });
    }
    const counts = days.map((d) =>
      this.covoiturages.filter((c) => {
        if (!c.dateDepart) return false;
        return new Date(c.dateDepart).toISOString().slice(0, 10) === d.key;
      }).length
    );
    return { labels: days.map((d) => d.label), counts };
  }

  private getTopRoutes(limit = 5): { labels: string[]; counts: number[] } {
    const map = new Map<string, number>();
    for (const c of this.covoiturages) {
      const key = `${c.pointDepart || '?'} → ${c.pointArrivee || '?'}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    return {
      labels: sorted.map(([k]) => (k.length > 28 ? k.slice(0, 27) + '…' : k)),
      counts: sorted.map(([, v]) => v)
    };
  }

  private getPriceBuckets(): { labels: string[]; counts: number[] } {
    const buckets = [
      { label: '0-5 DT', min: 0, max: 5 },
      { label: '5-10 DT', min: 5, max: 10 },
      { label: '10-20 DT', min: 10, max: 20 },
      { label: '20-50 DT', min: 20, max: 50 },
      { label: '50+ DT', min: 50, max: Number.POSITIVE_INFINITY }
    ];
    const counts = buckets.map(
      (b) => this.covoiturages.filter((c) => (c.prixParPassager || 0) >= b.min && (c.prixParPassager || 0) < b.max).length
    );
    return { labels: buckets.map((b) => b.label), counts };
  }

  private renderCharts(): void {
    this.renderTripsPerDay();
    this.renderOccupancy();
    this.renderTopRoutes();
    this.renderPriceDist();
    this.renderCO2PerDay();
  }

  private getCO2PerDay(): { labels: string[]; values: number[] } {
    const days: { label: string; key: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
      days.push({ label, key });
    }
    const values = days.map((d) =>
      this.covoiturages
        .filter((c) => c.dateDepart && new Date(c.dateDepart).toISOString().slice(0, 10) === d.key)
        .reduce((sum, c) => sum + this.service.estimateCO2SavedKg(c), 0)
    );
    return { labels: days.map((d) => d.label), values: values.map((v) => Math.round(v * 10) / 10) };
  }

  get totalCO2Saved(): number {
    return this.covoiturages.reduce((sum, c) => sum + this.service.estimateCO2SavedKg(c), 0);
  }

  get co2Saved7Days(): number {
    return this.getCO2PerDay().values.reduce((sum, v) => sum + v, 0);
  }

  private renderCO2PerDay(): void {
    if (!this.co2Canvas?.nativeElement) return;
    const { labels, values } = this.getCO2PerDay();
    this.co2ChartRef?.destroy();
    this.co2ChartRef = new Chart(this.co2Canvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'CO2 économisé (kg)',
          data: values,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#16a34a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} kg CO2` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => `${v} kg` } }
        }
      }
    });
  }

  private renderTripsPerDay(): void {
    if (!this.tripsPerDayCanvas?.nativeElement) return;
    const { labels, counts } = this.getTripsPerDay();
    this.tripsPerDayChartRef?.destroy();
    this.tripsPerDayChartRef = new Chart(this.tripsPerDayCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Trajets',
          data: counts,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  private renderOccupancy(): void {
    if (!this.occupancyCanvas?.nativeElement) return;
    this.occupancyChartRef?.destroy();
    const taken = this.seatsTaken;
    const free = this.totalSeatsAvailable;
    this.occupancyChartRef = new Chart(this.occupancyCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Occupées', 'Libres'],
        datasets: [{
          data: [taken, free],
          backgroundColor: ['#6366f1', '#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } }
        }
      }
    });
  }

  private renderTopRoutes(): void {
    if (!this.topRoutesCanvas?.nativeElement) return;
    const { labels, counts } = this.getTopRoutes();
    this.topRoutesChartRef?.destroy();
    this.topRoutesChartRef = new Chart(this.topRoutesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Trajets',
          data: counts,
          backgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  private renderPriceDist(): void {
    if (!this.priceDistCanvas?.nativeElement) return;
    const { labels, counts } = this.getPriceBuckets();
    this.priceDistChartRef?.destroy();
    this.priceDistChartRef = new Chart(this.priceDistCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Trajets',
          data: counts,
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  getDriverName(id: number): string {
    return this.driverNames.get(id) || 'Chargement…';
  }

  getPriceDelta(c: Covoiturage): number {
    if (c.prixSuggereParAI == null) return 0;
    return Math.round((c.prixParPassager - c.prixSuggereParAI) * 100) / 100;
  }

  getPassengerName(id: number): string {
    return this.passengerNames.get(id) || 'Chargement…';
  }

  private fetchUser(id: number) {
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    return this.http.get<any>(`${base}/users/${id}`, {
      withCredentials: environment.auth.withCredentials,
    }).pipe(catchError(() => of(null)));
  }

  private preloadDriverNames(ids: number[]): void {
    const unique = [...new Set(ids.filter((id) => !!id && !this.driverNames.has(id)))];
    if (unique.length === 0) return;

    forkJoin(unique.map((id) => this.fetchUser(id))).subscribe((users) => {
      users.forEach((user: any, index: number) => {
        const id = unique[index];
        this.driverNames.set(id, this.formatName(user, id));
      });
    });
  }

  private preloadPassengerNames(ids: number[]): void {
    const unique = [...new Set(ids.filter((id) => !!id && !this.passengerNames.has(id)))];
    if (unique.length === 0) return;

    forkJoin(unique.map((id) => this.fetchUser(id))).subscribe((users) => {
      users.forEach((user: any, index: number) => {
        const id = unique[index];
        this.passengerNames.set(id, this.formatName(user, id));
      });
    });
  }

  private formatName(user: any, fallbackId: number): string {
    if (!user) return `User #${fallbackId}`;
    const first = user.firstName || user.firstname || user.username || '';
    const last = user.lastName || user.lastname || '';
    const full = `${first} ${last}`.trim();
    return full || `User #${fallbackId}`;
  }

  get filteredCovoiturages(): Covoiturage[] {
    const q = this.search.trim().toLowerCase();
    const list = q
      ? this.covoiturages.filter((c) =>
          c.pointDepart?.toLowerCase().includes(q) ||
          c.pointArrivee?.toLowerCase().includes(q) ||
          (this.driverNames.get(c.idDriver) || '').toLowerCase().includes(q)
        )
      : [...this.covoiturages];

    return list.sort((a, b) => {
      if (this.sortKey === 'dateDepart') {
        return new Date(b.dateDepart).getTime() - new Date(a.dateDepart).getTime();
      }
      return (b[this.sortKey] as number) - (a[this.sortKey] as number);
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCovoiturages.length / this.pageSize));
  }

  get paginatedCovoiturages(): Covoiturage[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCovoiturages.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  onSortChange(): void {
    this.currentPage = 1;
  }

  get uniqueDriversCount(): number {
    return new Set(this.covoiturages.map((c) => c.idDriver)).size;
  }

  get totalSeatsAvailable(): number {
    return this.covoiturages.reduce((acc, c) => acc + (c.placesDisponibles || 0), 0);
  }

  get totalDistance(): number {
    return this.covoiturages.reduce((acc, c) => acc + (c.distance || 0), 0);
  }

  openEdit(covoiturage: Covoiturage): void {
    this.editing = { ...covoiturage };
    this.editMap = undefined;
    this.editDirectionsService = undefined;
    this.editDirectionsRenderer = undefined;
    this.editDepartMarker = undefined;
    this.editArriveeMarker = undefined;

    this.mapsLoader.load().then(() => {
      setTimeout(() => this.initEditMap(), 200);
    });
  }

  closeEdit(): void {
    this.editing = null;
    this.saving = false;
    this.editMap = undefined;
    this.editDirectionsService = undefined;
    this.editDirectionsRenderer = undefined;
    this.editDepartMarker = undefined;
    this.editArriveeMarker = undefined;
  }

  private initEditMap(): void {
    if (!this.editing || !this.editMapEl?.nativeElement) return;

    this.editMap = new google.maps.Map(this.editMapEl.nativeElement, {
      zoom: 7,
      center: { lat: 34.0, lng: 9.0 },
      mapTypeControl: false,
      streetViewControl: false
    });

    this.editDirectionsService = new google.maps.DirectionsService();
    this.editDirectionsRenderer = new google.maps.DirectionsRenderer({
      map: this.editMap,
      suppressMarkers: false,
      polylineOptions: { strokeColor: '#6366f1', strokeWeight: 5 }
    });

    if (this.editDepartInputEl?.nativeElement) {
      const departAuto = new google.maps.places.Autocomplete(this.editDepartInputEl.nativeElement, {
        types: ['geocode', 'establishment']
      });
      departAuto.addListener('place_changed', () => {
        this.ngZone.run(() => {
          if (!this.editing) return;
          const place = departAuto.getPlace();
          if (!place.geometry) return;
          this.editing.pointDepart = place.formatted_address || place.name;
          this.editing.lattitudeDepart = place.geometry.location.lat();
          this.editing.longitudeDepart = place.geometry.location.lng();
          this.updateEditRoute();
        });
      });
    }

    if (this.editArriveeInputEl?.nativeElement) {
      const arriveeAuto = new google.maps.places.Autocomplete(this.editArriveeInputEl.nativeElement, {
        types: ['geocode', 'establishment']
      });
      arriveeAuto.addListener('place_changed', () => {
        this.ngZone.run(() => {
          if (!this.editing) return;
          const place = arriveeAuto.getPlace();
          if (!place.geometry) return;
          this.editing.pointArrivee = place.formatted_address || place.name;
          this.editing.latitudeArrivee = place.geometry.location.lat();
          this.editing.longitudeArrivee = place.geometry.location.lng();
          this.updateEditRoute();
        });
      });
    }

    if (this.editing.lattitudeDepart && this.editing.latitudeArrivee) {
      this.updateEditRoute();
    }
  }

  private updateEditRoute(): void {
    if (!this.editing || !this.editMap || !this.editDirectionsService) return;

    if (this.editDepartMarker) { this.editDepartMarker.setMap(null); this.editDepartMarker = null; }
    if (this.editArriveeMarker) { this.editArriveeMarker.setMap(null); this.editArriveeMarker = null; }
    this.editDirectionsRenderer.setDirections({ routes: [] });

    const hasDepart = !!this.editing.lattitudeDepart && !!this.editing.longitudeDepart;
    const hasArrivee = !!this.editing.latitudeArrivee && !!this.editing.longitudeArrivee;

    if (hasDepart && hasArrivee) {
      this.editDirectionsService.route(
        {
          origin: { lat: this.editing.lattitudeDepart, lng: this.editing.longitudeDepart },
          destination: { lat: this.editing.latitudeArrivee, lng: this.editing.longitudeArrivee },
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result: any, status: any) => {
          this.ngZone.run(() => {
            if (!this.editing) return;
            if (status === google.maps.DirectionsStatus.OK) {
              this.editDirectionsRenderer.setDirections(result);
              const leg = result.routes[0].legs[0];
              this.editing.distance = Math.round((leg.distance.value / 1000) * 10) / 10;
              this.editing.dureeEstimee = Math.round(leg.duration.value / 60);
            }
          });
        }
      );
    } else if (hasDepart) {
      const pos = { lat: this.editing.lattitudeDepart, lng: this.editing.longitudeDepart };
      this.editDepartMarker = new google.maps.Marker({ position: pos, map: this.editMap, label: 'A' });
      this.editMap.setCenter(pos);
      this.editMap.setZoom(12);
    } else if (hasArrivee) {
      const pos = { lat: this.editing.latitudeArrivee, lng: this.editing.longitudeArrivee };
      this.editArriveeMarker = new google.maps.Marker({ position: pos, map: this.editMap, label: 'B' });
      this.editMap.setCenter(pos);
      this.editMap.setZoom(12);
    }
  }

  saveEdit(): void {
    if (!this.editing) return;
    this.saving = true;
    this.service.updateCovoiturage(this.editing).subscribe({
      next: (updated) => {
        const idx = this.covoiturages.findIndex((c) => c.id === updated.id);
        if (idx >= 0) this.covoiturages[idx] = updated;
        this.toast.success('Trajet mis à jour.');
        this.closeEdit();
      },
      error: () => {
        this.saving = false;
        this.toast.error('Échec de la mise à jour du trajet.');
      }
    });
  }

  askDelete(covoiturage: Covoiturage): void {
    this.deleting = covoiturage;
  }

  cancelDelete(): void {
    if (this.deletingInProgress) return;
    this.deleting = null;
  }

  confirmDelete(): void {
    if (!this.deleting?.id) return;
    this.deletingInProgress = true;
    const id = this.deleting.id;
    this.service.deleteCovoiturage(id).subscribe({
      next: () => {
        this.covoiturages = this.covoiturages.filter((c) => c.id !== id);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        this.toast.success('Trajet supprimé.');
        this.deletingInProgress = false;
        this.deleting = null;
        if (this.viewingDetail?.id === id) this.closeDetail();
      },
      error: () => {
        this.deletingInProgress = false;
        this.toast.error('Échec de la suppression du trajet.');
      }
    });
  }

  openDetail(covoiturage: Covoiturage): void {
    if (!covoiturage.id) return;
    this.viewingDetail = covoiturage;
    this.reservations = [];
    this.reservationsLoading = true;
    this.map = undefined;

    this.service.getReservationsByCovoiturage(covoiturage.id).subscribe({
      next: (data) => {
        this.reservations = data || [];
        this.reservationsLoading = false;
        this.preloadPassengerNames(this.reservations.map((r) => r.idPassenger));
      },
      error: () => {
        this.reservationsLoading = false;
        this.toast.error('Échec du chargement des réservations.');
      }
    });

    this.showRouteOnMap();
  }

  closeDetail(): void {
    this.viewingDetail = null;
    this.reservations = [];
    this.map = undefined;
  }

  private showRouteOnMap(): void {
    const trip = this.viewingDetail;
    if (!trip || !trip.lattitudeDepart || !trip.latitudeArrivee) return;

    this.mapsLoader.load().then(() => {
      setTimeout(() => {
        if (!this.detailMapEl?.nativeElement || !this.viewingDetail) return;

        this.map = new google.maps.Map(this.detailMapEl.nativeElement, {
          zoom: 7,
          center: { lat: 34.0, lng: 9.0 },
          mapTypeControl: false,
          streetViewControl: false
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map: this.map,
          suppressMarkers: false,
          polylineOptions: { strokeColor: '#6366f1', strokeWeight: 5 }
        });

        directionsService.route(
          {
            origin: { lat: trip.lattitudeDepart, lng: trip.longitudeDepart },
            destination: { lat: trip.latitudeArrivee, lng: trip.longitudeArrivee },
            travelMode: google.maps.TravelMode.DRIVING
          },
          (result: any, status: any) => {
            this.ngZone.run(() => {
              if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
              }
            });
          }
        );
      }, 150);
    });
  }

  deleteReservation(reservation: Reservation): void {
    if (!reservation.id) return;
    this.service.deleteReservation(reservation.id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter((r) => r.id !== reservation.id);
        this.toast.success('Réservation supprimée.');
      },
      error: () => this.toast.error('Échec de la suppression de la réservation.')
    });
  }
}
