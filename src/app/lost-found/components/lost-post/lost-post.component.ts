import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItem } from '../../models/lost-item.model';

@Component({
  selector: 'app-lost-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="post-container">
      <div class="post-glass-card">
        <header class="post-header">
          <div class="icon-circle">
            <i class="bi bi-megaphone-fill"></i>
          </div>
          <h1>New Listing</h1>
          <p>Provide as many details as possible to increase your chances.</p>
        </header>
        
        <form (ngSubmit)="onSubmit()" #postForm="ngForm" class="post-form">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Listing type</label>
              <div class="type-selector">
                <div class="type-option" [class.active]="item.type === 'LOST'" (click)="item.type = 'LOST'">
                  <i class="bi bi-search"></i> Lost
                </div>
                <div class="type-option" [class.active]="item.type === 'FOUND'" (click)="item.type = 'FOUND'">
                  <i class="bi bi-hand-thumbs-up"></i> Found
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Listing title</label>
              <input type="text" [(ngModel)]="item.title" name="title" placeholder="e.g. Blue iPhone 13 Pro..." required>
            </div>

            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="item.category" name="category" required>
                <option value="" disabled selected>Select...</option>
                <option value="Électronique">Electronics</option>
                <option value="Documents">Documents</option>
                <option value="Vêtements">Clothing</option>
                <option value="Clés">Keys</option>
                <option value="Autre">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label>Exact location</label>
              <input type="text" [(ngModel)]="item.location" name="location" placeholder="e.g. Ground floor library..." required>
            </div>

            <div class="form-group image-upload-group">
              <label>Image (web link or local file)</label>
              <input type="text" [(ngModel)]="item.imageUrl" name="imageUrl" placeholder="Or paste a link: https://...">
              <input type="file" (change)="onFileSelected($event)" accept="image/*" class="file-input">
              <div class="image-preview" *ngIf="item.imageUrl">
                <img [src]="item.imageUrl" alt="Item preview">
              </div>
            </div>

            <div class="form-group full-width">
              <label>Detailed description</label>
              <textarea [(ngModel)]="item.description" name="description" rows="4" placeholder="Color, unique marks, brand..."></textarea>
            </div>

            <div class="form-group full-width">
              <label>Contact information</label>
              <input type="text" [(ngModel)]="item.contactInfo" name="contactInfo" placeholder="Email or phone" required>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-ghost" routerLink="/lost-found">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="!postForm.form.valid">
              Publish listing
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .post-container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: 'Outfit', sans-serif; }
    
    .post-glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border-radius: 32px; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); width: 100%; max-width: 800px; padding: 3rem; }
    
    .post-header { text-align: center; margin-bottom: 3rem; }
    .icon-circle { width: 64px; height: 64px; background: #1e293b; color: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 1.5rem; }
    h1 { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .post-header p { color: #64748b; font-size: 1.1rem; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .full-width { grid-column: 1 / -1; }
    
    .form-group label { display: block; font-weight: 600; font-size: 0.9rem; color: #475569; margin-bottom: 0.5rem; }
    input, select, textarea { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #cbd5e1; background: white; font-family: inherit; transition: all 0.2s; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    
    .type-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .type-option { padding: 1rem; border-radius: 12px; border: 2px solid #e2e8f0; text-align: center; cursor: pointer; font-weight: 700; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .type-option:hover { border-color: #94a3b8; }
    .type-option.active { border-color: #1e293b; background: #1e293b; color: white; }
    
    .form-actions { margin-top: 3rem; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-ghost { padding: 0.8rem 2rem; border-radius: 12px; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn-submit { padding: 0.8rem 3rem; border-radius: 12px; border: none; background: #1e293b; color: white; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    .image-upload-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .file-input { padding: 0.5rem !important; border: 1px dashed #cbd5e1 !important; cursor: pointer; background: #f8fafc !important; }
    .file-input::file-selector-button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: 'Outfit'; margin-right: 1rem; transition: background 0.3s; }
    .file-input::file-selector-button:hover { background: #2563eb; }
    .image-preview { margin-top: 1rem; text-align: center; }
    .image-preview img { max-width: 100%; max-height: 150px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid white; }
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
    imageUrl: '',
    status: 'ACTIVE',
    userId: Number(localStorage.getItem('userId') || 0)
  };

  constructor(private lostService: LostAndFoundService, private router: Router) { }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.item.imageUrl = e.target.result; // Store image as Base64 in imageUrl
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    this.lostService.createItem(this.item).subscribe(() => {
      this.router.navigate(['/lost-found']);
    });
  }
}
