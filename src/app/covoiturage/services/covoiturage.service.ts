import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Covoiturage, Reservation, Vehicule, Notation, CO2Impact } from '../models/covoiturage.model';
import { UserService } from '../../user-security/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class CovoiturageService {

  private apiUrl = 'http://localhost:9092/api/covoiturage';
  private readonly userService = inject(UserService);

  constructor(private http: HttpClient) {}

  getCurrentUserId(): number {
    const user = this.userService.currentUser();
    if (user?.id) {
      const parsed = Number(user.id);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const stored = Number(localStorage.getItem('userId'));
    return !isNaN(stored) && stored > 0 ? stored : 0;
  }

  // ========== COVOITURAGE ==========

  addCovoiturage(covoiturage: Covoiturage): Observable<Covoiturage> {
    return this.http.post<Covoiturage>(`${this.apiUrl}/add`, covoiturage);
  }

  getCovoiturageById(id: number): Observable<Covoiturage> {
    return this.http.get<Covoiturage>(`${this.apiUrl}/${id}`);
  }

  getAllCovoiturages(): Observable<Covoiturage[]> {
    return this.http.get<Covoiturage[]>(`${this.apiUrl}/all`);
  }

  getCovoituragesByDriver(idDriver: number): Observable<Covoiturage[]> {
    return this.http.get<Covoiturage[]>(`${this.apiUrl}/driver/${idDriver}`);
  }

  updateCovoiturage(covoiturage: Covoiturage): Observable<Covoiturage> {
    return this.http.put<Covoiturage>(`${this.apiUrl}/update`, covoiturage);
  }

  deleteCovoiturage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getCO2Impact(id: number): Observable<CO2Impact> {
    return this.http.get<CO2Impact>(`${this.apiUrl}/${id}/co2-impact`);
  }

  estimateCO2SavedKg(c: Covoiturage): number {
    const occupants = Math.max(1, (c.nombrePlaces - c.placesDisponibles) + 1);
    const co2Solo = c.distance * 7.0 / 100.0 * 2.31;
    const saved = co2Solo - (co2Solo / occupants);
    const total = saved * (occupants - 1);
    return Math.round(total * 100) / 100;
  }

  // ========== RESERVATION ==========

  addReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/reservation/add`, reservation);
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/reservation/${id}`);
  }

  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservation/all`);
  }

  getReservationsByPassenger(idPassenger: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservation/mesReservation/${idPassenger}`);
  }

  getReservationsByCovoiturage(covoiturageId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservation/covoiturage/${covoiturageId}`);
  }

  getReservationsByDriver(idDriver: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservation/driver/${idDriver}`);
  }

  accepterReservation(id: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservation/accepter/${id}`, {});
  }

  refuserReservation(id: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservation/refuser/${id}`, {});
  }

  updateReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/reservation/update`, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservation/delete/${id}`);
  }

  // ========== VEHICULE ==========

  addVehicule(vehicule: Vehicule, imageFile?: File): Observable<Vehicule> {
    const formData = new FormData();
    formData.append('marque', vehicule.marque);
    formData.append('immatriculation', vehicule.immatriculation);
    formData.append('couleur', vehicule.couleur);
    formData.append('capacite', vehicule.capacite.toString());
    formData.append('idUtilisateur', vehicule.idUtilisateur.toString());
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return this.http.post<Vehicule>(`${this.apiUrl}/vehicule/add`, formData);
  }

  getVehiculeById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.apiUrl}/vehicule/${id}`);
  }

  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.apiUrl}/vehicule/all`);
  }

  getVehiculesByUtilisateur(idUtilisateur: number): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.apiUrl}/vehicule/voitures/${idUtilisateur}`);
  }

  updateVehicule(vehicule: Vehicule, imageFile?: File): Observable<Vehicule> {
    const formData = new FormData();
    formData.append('id', vehicule.id!.toString());
    formData.append('marque', vehicule.marque);
    formData.append('immatriculation', vehicule.immatriculation);
    formData.append('couleur', vehicule.couleur);
    formData.append('capacite', vehicule.capacite.toString());
    formData.append('idUtilisateur', vehicule.idUtilisateur.toString());
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return this.http.put<Vehicule>(`${this.apiUrl}/vehicule/update`, formData);
  }

  deleteVehicule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicule/delete/${id}`);
  }

  getVehiculeImageUrl(filename: string): string {
    return `http://localhost:9092/api/covoiturage/imagesVehicules/${filename}`;
  }

  // ========== NOTATION ==========

  addNotation(notation: Notation): Observable<Notation> {
    return this.http.post<Notation>(`${this.apiUrl}/notation/add`, notation);
  }

  getNotationsByRecepteur(idRecepteur: number): Observable<Notation[]> {
    return this.http.get<Notation[]>(`${this.apiUrl}/notation/recepteur/${idRecepteur}`);
  }

  getNotationsByDonneur(idDonneur: number): Observable<Notation[]> {
    return this.http.get<Notation[]>(`${this.apiUrl}/notation/donneur/${idDonneur}`);
  }

  updateNotation(notation: Notation): Observable<Notation> {
    return this.http.put<Notation>(`${this.apiUrl}/notation/update`, notation);
  }

  deleteNotation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notation/delete/${id}`);
  }

  // ========== ML - PREDICTION COUT ==========

  predictCost(data: {
    distance_km: number;
    duree_min: number;
    nombre_places: number;
    prix_carburant_litre?: number;
    consommation_moyenne?: number;
  }): Observable<any> {
    return this.http.post<any>('http://localhost:5002/api/covoiturage/predict-cost', data);
  }

  sendPriceFeedback(data: {
    distance_km: number;
    duree_min: number;
    nombre_places: number;
    prix_par_passager_user: number;
    prix_carburant_litre?: number;
    consommation_moyenne?: number;
  }): Observable<any> {
    return this.http.post<any>('http://localhost:5002/api/covoiturage/feedback', data);
  }

  // ========== USER ==========

  getUserById(id: number): Observable<{ id: number; username: string; email: string; imageUrl: string }> {
    return this.http.get<{ id: number; username: string; email: string; imageUrl: string }>(`http://localhost:8090/users/${id}`);
  }
}
