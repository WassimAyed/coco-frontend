import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { Covoiturage } from '../../models/covoiturage.model';

@Component({
  standalone: false,
  selector: 'app-covoiturage-list',
  templateUrl: './covoiturage-list.component.html',
  styleUrls: ['./covoiturage-list.component.css']
})
export class CovoiturageListComponent implements OnInit {

  covoiturages: Covoiturage[] = [];
  filteredCovoiturages: Covoiturage[] = [];
  searchTerm: string = '';
  loading = false;
  error = '';

  // Filters
  filterDepart: string = '';
  filterArrivee: string = '';
  filterPrixMax: number | null = null;
  filterDate: string = '';

  availableDeparts: string[] = [];
  availableArrivees: string[] = [];

  currentUserId: number = 0;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.covoiturageService.getCurrentUserId();
    this.loadCovoiturages();
  }

  loadCovoiturages(): void {
    this.loading = true;
    this.covoiturageService.getAllCovoiturages().subscribe({
      next: (data) => {
        const now = Date.now();
        const upcoming = (data || []).filter(c => {
          if (!c.dateDepart) return false;
          return new Date(c.dateDepart).getTime() > now;
        });

        this.covoiturages = upcoming;
        this.filteredCovoiturages = upcoming;
        this.availableDeparts = [...new Set(upcoming.map(c => c.pointDepart))].sort();
        this.availableArrivees = [...new Set(upcoming.map(c => c.pointArrivee))].sort();
        this.loading = false;
      },
      error: (err) => {
          console.log('ERROR FULL:', err);
  console.log('STATUS:', err.status);
  console.log('MESSAGE:', err.message);
        this.error = 'Impossible de charger les trajets.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    this.filteredCovoiturages = this.covoiturages.filter(c => {
      if (this.filterDepart && c.pointDepart !== this.filterDepart) return false;
      if (this.filterArrivee && c.pointArrivee !== this.filterArrivee) return false;
      if (this.filterPrixMax !== null && c.prixParPassager > this.filterPrixMax) return false;
      if (this.filterDate) {
        const filterDay = this.filterDate;
        const departDay = c.dateDepart?.substring(0, 10);
        if (departDay !== filterDay) return false;
      }
      return true;
    });
  }

  filterBySearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredCovoiturages = this.covoiturages;
      return;
    }
    this.filteredCovoiturages = this.covoiturages.filter(c =>
      c.pointDepart.toLowerCase().includes(term) ||
      c.pointArrivee.toLowerCase().includes(term) ||
      c.prixParPassager.toString().includes(term)
    );
  }

  resetFilters(): void {
    this.filterDepart = '';
    this.filterArrivee = '';
    this.filterPrixMax = null;
    this.filterDate = '';
    this.searchTerm = '';
    this.filteredCovoiturages = this.covoiturages;
  }

  viewDetails(id: number): void {
    this.router.navigate(['/covoiturage/detail', id]);
  }

  createTrajet(): void {
    this.router.navigate(['/covoiturage/create']);
  }

  mesReservations(): void {
    this.router.navigate(['/covoiturage/mes-reservations']);
  }

  mesTrajets(): void {
    this.router.navigate(['/covoiturage/mes-trajets']);
  }

  gestionReservations(): void {
    this.router.navigate(['/covoiturage/gestion-reservations']);
  }

  canReserve(c: Covoiturage): boolean {
    return c.idDriver !== this.currentUserId && c.placesDisponibles > 0;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

