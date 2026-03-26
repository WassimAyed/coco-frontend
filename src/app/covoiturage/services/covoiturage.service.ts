import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Covoiturage, Reservation, Vehicule } from '../models/covoiturage.model';

@Injectable({
  providedIn: 'root'
})
export class CovoiturageService {

  private apiUrl = 'http://localhost:8092/covoiturage';

  constructor(private http: HttpClient) {}

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
    return `http://localhost:8092/imagesVehicules/${filename}`;
  }
}
