import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CovoiturageService } from '../../services/covoiturage.service';
import { Covoiturage, Vehicule } from '../../models/covoiturage.model';

@Component({
  selector: 'app-covoiturage-create',
  templateUrl: './covoiturage-create.component.html',
  styleUrls: ['./covoiturage-create.component.scss']
})
export class CovoiturageCreateComponent implements OnInit {

  covoiturage: Covoiturage = {
    pointDepart: '',
    pointArrivee: '',
    dateDepart: '',
    nombrePlaces: 1,
    placesDisponibles: 1,
    prixParPassager: 0,
    distance: 0,
    dureeEstimee: 0,
    idDriver: 0,
    vehicleId: 0
  };

  vehicules: Vehicule[] = [];
  error = '';
  currentUserId: number = 0;

  // Confirm modal
  showConfirmModal = false;
  pendingDeleteVehiculeId: number | null = null;

  // Vehicule modal
  showVehiculeModal = false;
  vehiculeForm: Vehicule = this.emptyVehicule();
  vehiculeError = '';
  vehiculeLoading = false;
  isEditMode = false;
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private covoiturageService: CovoiturageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId'));
    this.covoiturage.idDriver = this.currentUserId;
    this.loadVehicules();
  }

  loadVehicules(): void {
    this.covoiturageService.getVehiculesByUtilisateur(this.currentUserId).subscribe({
      next: (data) => {
        this.vehicules = data;
        if (data.length > 0) {
          this.covoiturage.vehicleId = data[0].id!;
        }
      },
      error: (err) => console.error('Erreur chargement vehicules', err)
    });
  }

  onNombrePlacesChange(): void {
    this.covoiturage.placesDisponibles = this.covoiturage.nombrePlaces;
  }

  submit(): void {
    this.error = '';

    if (!this.covoiturage.pointDepart || !this.covoiturage.pointArrivee || !this.covoiturage.dateDepart) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (!this.covoiturage.vehicleId || this.covoiturage.vehicleId === 0) {
      this.error = 'Veuillez ajouter ou selectionner un vehicule.';
      return;
    }

    this.covoiturage.placesDisponibles = this.covoiturage.nombrePlaces;

    this.covoiturageService.addCovoiturage(this.covoiturage).subscribe({
      next: () => this.router.navigate(['/covoiturage/list']),
      error: (err) => {
        this.error = 'Erreur lors de la creation du trajet.';
        console.error(err);
      }
    });
  }

  // ========== VEHICULE MODAL ==========

  emptyVehicule(): Vehicule {
    return {
      idUtilisateur: 0,
      marque: '',
      immatriculation: '',
      couleur: '',
      capacite: 4,
      image: ''
    };
  }

  openAddVehicule(): void {
    this.vehiculeForm = this.emptyVehicule();
    this.vehiculeForm.idUtilisateur = this.currentUserId;
    this.vehiculeError = '';
    this.isEditMode = false;
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.showVehiculeModal = true;
  }

  openEditVehicule(v: Vehicule): void {
    this.vehiculeForm = { ...v };
    this.vehiculeError = '';
    this.isEditMode = true;
    this.selectedImageFile = null;
    this.imagePreview = v.image ? this.covoiturageService.getVehiculeImageUrl(v.image) : null;
    this.showVehiculeModal = true;
  }

  closeVehiculeModal(): void {
    this.showVehiculeModal = false;
    this.vehiculeError = '';
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  submitVehicule(): void {
    this.vehiculeError = '';

    if (!this.vehiculeForm.marque || !this.vehiculeForm.immatriculation || !this.vehiculeForm.couleur) {
      this.vehiculeError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.vehiculeLoading = true;

    const imageFile = this.selectedImageFile || undefined;

    if (this.isEditMode) {
      this.covoiturageService.updateVehicule(this.vehiculeForm, imageFile).subscribe({
        next: () => {
          this.vehiculeLoading = false;
          this.closeVehiculeModal();
          this.loadVehicules();
        },
        error: (err) => {
          this.vehiculeError = 'Erreur lors de la modification.';
          this.vehiculeLoading = false;
          console.error(err);
        }
      });
    } else {
      this.vehiculeForm.idUtilisateur = this.currentUserId;
      this.covoiturageService.addVehicule(this.vehiculeForm, imageFile).subscribe({
        next: (created) => {
          this.vehiculeLoading = false;
          this.closeVehiculeModal();
          this.loadVehicules();
        },
        error: (err) => {
          this.vehiculeError = 'Erreur lors de l\'ajout.';
          this.vehiculeLoading = false;
          console.error(err);
        }
      });
    }
  }

  deleteVehicule(id: number): void {
    this.pendingDeleteVehiculeId = id;
    this.showConfirmModal = true;
  }

  onConfirmDeleteVehicule(): void {
    if (this.pendingDeleteVehiculeId === null) return;
    const id = this.pendingDeleteVehiculeId;
    this.covoiturageService.deleteVehicule(id).subscribe({
      next: () => {
        this.loadVehicules();
        if (this.covoiturage.vehicleId === id) {
          this.covoiturage.vehicleId = 0;
        }
      },
      error: (err) => console.error(err)
    });
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDeleteVehiculeId = null;
  }

  getImageUrl(filename: string): string {
    return this.covoiturageService.getVehiculeImageUrl(filename);
  }

  goBack(): void {
    this.router.navigate(['/covoiturage/list']);
  }
}
