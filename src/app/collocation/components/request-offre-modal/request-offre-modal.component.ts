import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CollocationService } from '../../services/collocation.service';

@Component({
  selector: 'app-request-offre-modal',
  standalone: false,
  templateUrl: './request-offre-modal.component.html',
  styleUrl: './request-offre-modal.component.css'
})
export class RequestOffreModalComponent {


  @Input() offerId!: number;
  @Input() userId!: number;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  message = '';
  loading = false;
  error = '';

  constructor(private collocationService: CollocationService) {}

  submit(): void {
    if (!this.message.trim()) return;

    this.loading = true;
    this.error = '';

    const payload = {
      offer: { id: this.offerId },
      message: this.message
    };

    this.collocationService.createRequest(payload, this.userId).subscribe({
      next: () => {
        this.loading = false;
        this.message = '';
        this.submitted.emit();
      },
      error: err => {
        this.loading = false;
        this.error = 'Échec de l\'envoi. Veuillez réessayer.';
        console.error(err);
      }
    });
  }

  close(): void {
    this.message = '';
    this.error = '';
    this.closed.emit();
  }

}
