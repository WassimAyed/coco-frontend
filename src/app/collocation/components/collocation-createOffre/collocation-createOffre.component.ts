import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-collocation-create-offre',
  templateUrl: './collocation-createOffre.component.html'
})
export class CollocationCreateOffreComponent {
  offerForm: FormGroup;
  selectedFiles: File[] = [];
  selectedImageIndices: Set<number> = new Set();
  allSelected: boolean = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  tunisianVilles: string[] = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan'
];


  constructor(private fb: FormBuilder, private collocationService: CollocationService) {
    this.offerForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      prixLoc: [null, Validators.required],
      ville: ['', Validators.required],
      chambres: [null, Validators.required],
      meublee: [false],
      imagesColoc: [null] // optional, files handled separately
    });
  }

  // File input handler with proper type casting
  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      // Convert FileList to Array and cast to File[]
      const newFiles = Array.from(event.target.files) as File[];
      this.selectedFiles = [...this.selectedFiles, ...newFiles];

      // Reset file input to allow selecting same files again
      event.target.value = '';
    }
  }

  // Get image URL for preview
  getImageUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Truncate filename for display (replaces the pipe)
  truncateFileName(filename: string, maxLength: number = 15): string {
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength) + '...';
  }

  // Toggle selection for individual image
  toggleImageSelection(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedImageIndices.has(index)) {
      this.selectedImageIndices.delete(index);
    } else {
      this.selectedImageIndices.add(index);
    }

    this.allSelected = this.selectedImageIndices.size === this.selectedFiles.length;
  }

  // Select all images
  selectAllImages(): void {
    if (this.allSelected) {
      this.selectedImageIndices.clear();
    } else {
      this.selectedImageIndices = new Set(
        Array.from({ length: this.selectedFiles.length }, (_, i) => i)
      );
    }
    this.allSelected = !this.allSelected;
  }

  // Check if image is selected
  isImageSelected(index: number): boolean {
    return this.selectedImageIndices.has(index);
  }

  // Check if any images are selected
  hasSelectedImages(): boolean {
    return this.selectedImageIndices.size > 0;
  }

  // Get count of selected images
  getSelectedCount(): number {
    return this.selectedImageIndices.size;
  }

  // Delete single image
  deleteImage(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Revoke the object URL to prevent memory leaks
    const file = this.selectedFiles[index];
    const url = this.getImageUrl(file);
    URL.revokeObjectURL(url);

    // Remove the file from selectedFiles array
    this.selectedFiles.splice(index, 1);

    // Update selected indices
    const newSelectedIndices = new Set<number>();
    this.selectedImageIndices.forEach(idx => {
      if (idx > index) {
        newSelectedIndices.add(idx - 1);
      } else if (idx < index) {
        newSelectedIndices.add(idx);
      }
    });
    this.selectedImageIndices = newSelectedIndices;

    // Update allSelected status
    this.allSelected = this.selectedImageIndices.size === this.selectedFiles.length && this.selectedFiles.length > 0;
  }

  // Delete all selected images
  deleteSelectedImages(): void {
    if (!this.hasSelectedImages()) return;

    // Sort indices in descending order to avoid index shifting issues
    const indicesToDelete = Array.from(this.selectedImageIndices).sort((a, b) => b - a);

    // Revoke URLs for selected files
    indicesToDelete.forEach(index => {
      const file = this.selectedFiles[index];
      const url = this.getImageUrl(file);
      URL.revokeObjectURL(url);
    });

    indicesToDelete.forEach(index => {
      this.selectedFiles.splice(index, 1);
    });

    // Clear selection
    this.selectedImageIndices.clear();
    this.allSelected = false;
  }

  // Clear all images
  clearAllImages(): void {
    // Revoke all object URLs
    this.selectedFiles.forEach(file => {
      const url = this.getImageUrl(file);
      URL.revokeObjectURL(url);
    });

    this.selectedFiles = [];
    this.selectedImageIndices.clear();
    this.allSelected = false;
  }

  // Cleanup when component is destroyed
  ngOnDestroy(): void {
    this.clearAllImages();
  }

  submit() {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form
    if (this.offerForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      this.offerForm.markAllAsTouched();
      return;
    }

    // Validate images
    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please select at least one image';
      return;
    }

    // Validate image sizes (optional - example: max 5MB per image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = this.selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      this.errorMessage = `Some images exceed 5MB limit: ${oversizedFiles.map(f => this.truncateFileName(f.name, 10)).join(', ')}`;
      return;
    }

    // Build the offer object (excluding files)
    const offer = {
      titre: this.offerForm.get('titre')?.value,
      description: this.offerForm.get('description')?.value,
      prixLoc: this.offerForm.get('prixLoc')?.value,
      ville: this.offerForm.get('ville')?.value,
      chambres: this.offerForm.get('chambres')?.value,
      meublee: this.offerForm.get('meublee')?.value
    };

    this.submitting = true;

    // Call the service with the offer object and selected files
    this.collocationService.createOffer(offer, this.selectedFiles).subscribe({
      next: (res: any) => {
        console.log('Offer created:', res);
        this.successMessage = 'Offer created successfully!';
        this.offerForm.reset();
        this.clearAllImages();
        this.submitting = false;
      },
      error: (err: any) => {
        console.error('Error creating offer:', err);
        this.errorMessage = err.error?.message || 'Failed to create offer. Please try again.';
        this.submitting = false;
      }
    });
  }

  // Reset form and clear all data
  resetForm(): void {
    this.offerForm.reset({
      meublee: false
    });
    this.clearAllImages();
    this.errorMessage = '';
    this.successMessage = '';
  }
}
