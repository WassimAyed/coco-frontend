import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, Payment } from '../../services/payment.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit {
  payments: Payment[] = [];
  loading = false;
  error: string | null = null;
  downloadingInvoice: number | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getUserPayments().subscribe({
      next: (payments: any) => {
        this.payments = payments;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load payment history';
        console.error(error);
        this.loading = false;
      }
    });
  }

  downloadInvoice(payment: Payment): void {
    this.downloadingInvoice = payment.id;
    this.paymentService.downloadInvoice(payment.id).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${payment.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingInvoice = null;
      },
      error: (error: any) => {
        this.error = 'Failed to download invoice';
        console.error(error);
        this.downloadingInvoice = null;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
