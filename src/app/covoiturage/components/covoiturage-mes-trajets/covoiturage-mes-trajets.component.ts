import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { Covoiturage, Vehicule } from '../../models/covoiturage.model';

@Component({
  selector: 'app-covoiturage-mes-trajets',
  templateUrl: './covoiturage-mes-trajets.component.html',
  styleUrls: ['./covoiturage-mes-trajets.component.scss']
})
export class CovoiturageMesTrajetsComponent implements OnInit {

  trajets: Covoiturage[] = [];
  loading = false;
  currentUserId: number = 0;

  // Confirm modal
  showConfirmModal = false;
  confirmMessage = '';
  pendingDeleteId: number | null = null;

  // Edit modal
  showEditModal = false;
  editTrajet: Covoiturage | null = null;
  vehicules: Vehicule[] = [];
  editError = '';
  editLoading = false;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId'));
    this.loadMesTrajets();
    this.loadVehicules();
  }

  loadMesTrajets(): void {
    this.loading = true;
    this.covoiturageService.getCovoituragesByDriver(this.currentUserId).subscribe({
      next: (data) => { this.trajets = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  loadVehicules(): void {
    this.covoiturageService.getVehiculesByUtilisateur(this.currentUserId).subscribe({
      next: (data) => this.vehicules = data,
      error: (err) => console.error(err)
    });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/covoiturage/detail', id]);
  }

  openEditModal(trajet: Covoiturage): void {
    this.editTrajet = { ...trajet };
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editTrajet = null;
    this.editError = '';
  }

  onEditNombrePlacesChange(): void {
    if (this.editTrajet) {
      this.editTrajet.placesDisponibles = this.editTrajet.nombrePlaces;
    }
  }

  submitEdit(): void {
    if (!this.editTrajet) return;
    this.editError = '';

    if (!this.editTrajet.pointDepart || !this.editTrajet.pointArrivee || !this.editTrajet.dateDepart) {
      this.editError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.editLoading = true;
    this.covoiturageService.updateCovoiturage(this.editTrajet).subscribe({
      next: () => {
        this.editLoading = false;
        this.closeEditModal();
        this.loadMesTrajets();
      },
      error: (err) => {
        this.editError = 'Erreur lors de la modification du trajet.';
        this.editLoading = false;
        console.error(err);
      }
    });
  }

  deleteTrajet(id: number): void {
    this.pendingDeleteId = id;
    this.confirmMessage = 'Voulez-vous vraiment supprimer ce trajet ?';
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (this.pendingDeleteId === null) return;
    this.covoiturageService.deleteCovoiturage(this.pendingDeleteId).subscribe({
      next: () => this.loadMesTrajets(),
      error: (err) => console.error(err)
    });
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDeleteId = null;
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
