import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
  selector: 'app-lost-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="post-page">
      <div class="post-card">
        <h1>Annoncer un Objet</h1>
        <p>Aidez la communauté CoCo en signalant un objet perdu ou trouvé.</p>
        
        <form (ngSubmit)="onSubmit()" #postForm="ngForm">
          <div class="form-group">
            <label>Type d'annonce</label>
            <select [(ngModel)]="item.type" name="type" required>
              <option value="LOST">J'ai perdu un objet</option>
              <option value="FOUND">J'ai trouvé un objet</option>
            </select>
          </div>

          <div class="form-group">
            <label>Titre de l'objet</label>
            <input type="text" [(ngModel)]="item.title" name="title" placeholder="Ex: Portefeuille noir, Clés..." required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Catégorie</label>
              <input type="text" [(ngModel)]="item.category" name="category" placeholder="Ex: Accessoires..." required>
            </div>
            <div class="form-group">
              <label>Lieu</label>
              <input type="text" [(ngModel)]="item.location" name="location" placeholder="Ex: Campus, Bus..." required>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="item.description" name="description" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Contact (Email/Tel)</label>
            <input type="text" [(ngModel)]="item.contactInfo" name="contactInfo" required>
          </div>

          <button type="submit" class="btn btn-red" [disabled]="!postForm.form.valid">Publier l'annonce</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .post-page { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #fafafa; padding: 2rem; }
    .post-card { background: white; padding: 3rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); width: 100%; max-width: 600px; }
    h1 { font-size: 2rem; color: #000; margin-bottom: 0.5rem; text-align: center; }
    p { color: #888; text-align: center; margin-bottom: 2rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { display: block; font-weight: 700; margin-bottom: 0.5rem; font-size: 0.9rem; }
    input, select, textarea { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; }
    .btn-red { width: 100%; padding: 1rem; background: #e63030; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `]
})
export class LostPostComponent {
  item: LostItem = {
    title: '',
    description: '',
    type: 'LOST',
    category: '',
    location: '',
    dateTime: new Date().toISOString().split('T')[0],
    contactInfo: '',
    status: 'ACTIVE',
    userId: Number(localStorage.getItem('userId') || 0)
  };

  constructor(private lostService: LostAndFoundService, private router: Router) { }

  onSubmit() {
    this.lostService.createItem(this.item).subscribe(() => {
      this.router.navigate(['/lost-found']);
    });
  }
}
