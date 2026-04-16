import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../services/lost-found.service';
import { LostItemCreateRequest, LostItemResponse, LostItemUpdateRequest } from '../../models/lost-item.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-lost-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="post-page">
      <header class="page-header">
        <div class="header-content">
          <div>
            <span class="header-eyebrow">Listing Manager</span>
            <h1 class="header-title">{{ isEditMode ? 'Edit Listing' : 'Post New Item' }}</h1>
            <p class="header-subtitle">Provide details to help the community identify the item.</p>
          </div>
          <button class="btn-outline" routerLink="/lost-found">
            <i class="bi bi-arrow-left"></i> Back to Hub
          </button>
        </div>
        <div class="header-decoration">
          <div class="deco-circle deco-circle--1"></div>
          <div class="deco-circle deco-circle--2"></div>
        </div>
      </header>

      <div class="form-container">
        <div class="form-card">
          <form (ngSubmit)="onSubmit()" #postForm="ngForm">
            <div class="form-section">
              <h3 class="section-title"><i class="bi bi-info-circle"></i> Basic Information</h3>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Service Type</label>
                  <div class="type-toggle">
                    <button type="button" class="toggle-btn" [class.active]="item.type === 'LOST'" (click)="item.type = 'LOST'">
                      <i class="bi bi-search"></i> Lost Something
                    </button>
                    <button type="button" class="toggle-btn" [class.active]="item.type === 'FOUND'" (click)="item.type = 'FOUND'">
                      <i class="bi bi-gift"></i> Found Something
                    </button>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label>Title</label>
                  <div class="input-with-icon">
                    <i class="bi bi-type"></i>
                    <input type="text" [(ngModel)]="item.title" name="title" placeholder="e.g. Leather Wallet, Blue Backpack..." required>
                  </div>
                </div>

                <div class="form-group">
                  <label>Category</label>
                  <div class="input-with-icon">
                    <i class="bi bi-tag"></i>
                    <select [(ngModel)]="item.category" name="category" required>
                      <option value="" disabled selected>Select category...</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Documents">Documents</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Keys">Keys</option>
                      <option value="Pets">Pets</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Location</label>
                  <div class="input-with-icon">
                    <i class="bi bi-geo-alt"></i>
                    <input type="text" [(ngModel)]="item.location" name="location" placeholder="Campus, Room 102..." required>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title"><i class="bi bi-card-text"></i> Details & Media</h3>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Description</label>
                  <textarea [(ngModel)]="item.description" name="description" rows="4" placeholder="Mention color, brand, or any unique identifiers..."></textarea>
                </div>

                <div class="form-group full-width">
                  <label>Image Upload</label>
                  <div class="upload-zone" [class.has-preview]="item.imageUrl">
                    <div class="upload-actions" *ngIf="!item.imageUrl">
                      <i class="bi bi-cloud-upload"></i>
                      <p>Drag or click to upload</p>
                      <input type="file" (change)="onFileSelected($event)" accept="image/*">
                    </div>
                    <div class="upload-preview" *ngIf="item.imageUrl" (click)="item.imageUrl = ''">
                      <img [src]="item.imageUrl" alt="Preview">
                      <div class="remove-overlay"><i class="bi bi-trash"></i> Replace</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title"><i class="bi bi-person-badge"></i> Contact Info</h3>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Contact Method</label>
                  <div class="input-with-icon">
                    <i class="bi bi-chat-dots"></i>
                    <input type="text" [(ngModel)]="item.contactInfo" name="contactInfo" placeholder="Phone, email or social handle" required>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-footer">
              <button type="submit" class="btn-submit" [disabled]="!postForm.form.valid">
                {{ isEditMode ? 'Update Listing' : 'Publish Listing' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .post-page { min-height: 100vh; background: #fdfdfd; font-family: 'Outfit', sans-serif; }

    /* Header Standard */
    .page-header {
      position: relative;
      background: linear-gradient(135deg, #1a1a1a 0%, #262626 55%, #3d1417 100%);
      padding: 3.5rem 2.5rem 4.5rem;
      overflow: hidden;
      color: #fff;
    }
    .header-content { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-eyebrow { display: inline-flex; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #f83441; background: rgba(248, 52, 65, 0.1); padding: 0.3rem 0.8rem; border-radius: 30px; border: 1px solid rgba(248, 52, 65, 0.3); margin-bottom: 0.8rem; }
    .header-title { font-size: 2.2rem; font-weight: 800; margin: 0; }
    .header-subtitle { color: rgba(255,255,255,0.6); margin: 0.4rem 0 0; }
    
    .btn-outline { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.7rem 1.2rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s; text-decoration: none; }
    .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

    .header-decoration { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
    .deco-circle { position: absolute; border-radius: 50%; background: #f83441; opacity: 0.08; }
    .deco-circle--1 { width: 400px; height: 400px; right: -100px; top: -150px; }
    .deco-circle--2 { width: 250px; height: 250px; left: 10%; bottom: -50px; opacity: 0.05; background: white; }

    /* Form Design */
    .form-container { max-width: 800px; margin: -2.5rem auto 4rem; padding: 0 1.5rem; position: relative; z-index: 5; }
    .form-card { background: white; border-radius: 28px; padding: 3rem; box-shadow: 0 20px 50px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; }
    
    .form-section { margin-bottom: 2.5rem; }
    .section-title { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; color: #f83441; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .full-width { grid-column: 1 / -1; }
    
    .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.03em; }
    
    .input-with-icon { position: relative; }
    .input-with-icon i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .input-with-icon input, .input-with-icon select { padding-left: 2.75rem; }
    
    input, select, textarea { width: 100%; padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 500; font-family: inherit; transition: all 0.2s; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #f83441; background: white; box-shadow: 0 0 0 4px rgba(248, 52, 65, 0.08); }

    .type-toggle { display: flex; gap: 1rem; }
    .toggle-btn { flex: 1; padding: 1rem; border-radius: 14px; border: 1.5px solid #e2e8f0; background: white; color: #64748b; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; transition: all 0.2s; }
    .toggle-btn.active { border-color: #f83441; background: rgba(248, 52, 65, 0.05); color: #f83441; box-shadow: 0 8px 16px rgba(248, 52, 65, 0.1); }
    
    /* Upload Zone */
    .upload-zone { border: 2px dashed #cbd5e1; border-radius: 16px; background: #f8fafc; min-height: 160px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; transition: all 0.2s; }
    .upload-zone:hover { border-color: #f83441; background: #fff1f2; }
    .upload-actions { text-align: center; color: #94a3b8; }
    .upload-actions i { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .upload-actions p { margin: 0; font-weight: 600; font-size: 0.9rem; }
    .upload-actions input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    
    .upload-preview { width: 100%; height: 100%; position: absolute; cursor: pointer; }
    .upload-preview img { width: 100%; height: 100%; object-fit: cover; }
    .remove-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700; opacity: 0; transition: 0.2s; }
    .upload-preview:hover .remove-overlay { opacity: 1; }

    .form-footer { margin-top: 3.5rem; }
    .btn-submit { width: 100%; padding: 1rem; border-radius: 14px; border: none; background: #1a1a1a; color: white; font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.15); background: #f83441; }
    .btn-submit:disabled { opacity: 0.4; transform: none; cursor: not-allowed; }
  `]
})
export class LostPostComponent {
  isEditMode = false;
  editingItemId: number | null = null;
  selectedImageFile: File | null = null;

  item: LostItemCreateRequest = {
    title: '',
    description: '',
    type: 'LOST',
    category: '',
    location: '',
    contactInfo: '',
    imageUrl: ''
  };

  constructor(
    private lostService: LostAndFoundService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    const editIdParam = this.route.snapshot.queryParamMap.get('editId');

    if (editIdParam) {
      this.isEditMode = true;
      this.editingItemId = Number(editIdParam);

      this.lostService.getItemById(this.editingItemId).subscribe({
        next: (data: LostItemResponse) => {
          this.item = {
            title: data.title,
            description: data.description,
            type: data.type,
            category: data.category,
            location: data.location,
            contactInfo: data.contactInfo,
            imageUrl: data.imageUrl || ''
          };
        },
        error: () => {
          this.router.navigate(['/lost-found/my-items']);
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.item.imageUrl = (e.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    const payload: LostItemUpdateRequest = {
      title: this.item.title,
      description: this.item.description,
      type: this.item.type,
      category: this.item.category,
      location: this.item.location,
      contactInfo: this.item.contactInfo,
      imageUrl: this.item.imageUrl
    };

    const submitWithPayload = (finalPayload: LostItemUpdateRequest) => {
      if (this.isEditMode && this.editingItemId) {
        this.lostService.updateItem(this.editingItemId, finalPayload).subscribe({
          next: () => {
            this.router.navigate(['/lost-found/my-items']);
          },
          error: (err) => {
            const message = err?.error?.message || 'Unable to update this listing.';
            this.toast.error(message, 'Update failed');
          }
        });
        return;
      }

      this.lostService.createItem(finalPayload).subscribe({
        next: () => {
          this.router.navigate(['/lost-found']);
        },
        error: (err) => {
          const message = err?.error?.message || 'Unable to create this listing.';
          this.toast.error(message, 'Create failed');
        }
      });
    };

    if (this.selectedImageFile) {
      this.lostService.uploadImage(this.selectedImageFile).subscribe({
        next: (res) => {
          submitWithPayload({ ...payload, imageUrl: res.imageUrl });
        },
        error: () => {
          this.toast.error('Unable to upload image. Please try again.', 'Upload failed');
        }
      });
      return;
    }

    submitWithPayload(payload);
  }
}
