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
  submitting = false;
  errorMessage = '';
  successMessage = '';

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

  // File input handler
  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  submit() {
    if (this.offerForm.invalid) return;

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
      next: res => {
        console.log('Offer created:', res);
        this.successMessage = 'Offer created successfully!';
        this.offerForm.reset();
        this.selectedFiles = [];
        this.submitting = false;
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to create offer';
        this.submitting = false;
      }
    });
  }
}
