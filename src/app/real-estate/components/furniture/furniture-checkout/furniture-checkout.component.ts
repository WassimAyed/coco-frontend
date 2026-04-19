import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-furniture-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './furniture-checkout.component.html',
  styleUrls: ['./furniture-checkout.component.scss']
})
export class FurnitureCheckoutComponent {

  form = {
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    paymentMethod: ''
  };

  // CIB
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  selectedCard: any = null;

  cibCards = [
    { id: 'biat', label: 'BIAT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BIAT_logo.svg/200px-BIAT_logo.svg.png' },
    { id: 'stb', label: 'STB', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/STB_Bank_logo.png' },
    { id: 'bna', label: 'BNA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/BNA_logo.svg/200px-BNA_logo.svg.png' },
    { id: 'attijari', label: 'Attijari', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Attijari_bank_logo.svg/200px-Attijari_bank_logo.svg.png' },
    { id: 'cib', label: 'CIB Générique', logo: 'https://via.placeholder.com/60x30?text=CIB' },
  ];

  // Espèces / Livraison
  showDeliveryModal = false;
  deliveryChoice = '';

  // Virements
  selectedVirement: any = null;

  virements = [
    {
      id: 'flouci',
      label: 'Flouci',
      logo: 'https://flouci.com/assets/images/logo.png',
      description: 'Paiement mobile instantané',
      rib: 'N/A',
      instruction: 'Envoyez le montant au numéro : +216 55 424 245'
    },
    {
      id: 'd17',
      label: 'D17',
      logo: 'https://d17.com.tn/assets/logo.png',
      description: 'Portefeuille électronique',
      rib: 'N/A',
      instruction: 'Transférez via l\'app D17 au : +216 55 424 245'
    },
    {
      id: 'stb',
      label: 'STB Bank',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/STB_Bank_logo.png',
      description: 'Virement bancaire STB',
      rib: '10 STB 0123456789 47',
      instruction: 'Virement au RIB ci-dessus, objet : commande'
    },
    {
      id: 'bna',
      label: 'BNA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/BNA_logo.svg/200px-BNA_logo.svg.png',
      description: 'Virement bancaire BNA',
      rib: '08 BNA 0123456789 32',
      instruction: 'Virement au RIB ci-dessus, objet : commande'
    },
    {
      id: 'biat',
      label: 'BIAT',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BIAT_logo.svg/200px-BIAT_logo.svg.png',
      description: 'Virement bancaire BIAT',
      rib: '11 BIAT 0123456789 21',
      instruction: 'Virement au RIB ci-dessus, objet : commande'
    },
    {
      id: 'attijari',
      label: 'Attijari Bank',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Attijari_bank_logo.svg/200px-Attijari_bank_logo.svg.png',
      description: 'Virement bancaire Attijari',
      rib: '04 ATT 0123456789 15',
      instruction: 'Virement au RIB ci-dessus, objet : commande'
    }
  ];

  loading = false;
  confirmed = false;
  orderId: number | null = null;
  paymentRef = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  get total() { return this.cartService.getTotal(); }
  get items() { return this.cartService.getItems(); }

  selectMethod(method: string): void {
    this.form.paymentMethod = method;
    this.selectedCard = null;
    this.selectedVirement = null;
    this.deliveryChoice = '';
    if (method === 'CASH') {
      this.showDeliveryModal = true;
    }
  }

  canConfirm(): boolean {
    if (!this.form.firstName || !this.form.lastName ||
        !this.form.address || !this.form.phone) return false;
    if (!this.form.paymentMethod) return false;
    if (this.form.paymentMethod === 'CIB' &&
        (!this.selectedCard || !this.cardNumber ||
         !this.cardExpiry || !this.cardCvv)) return false;
    if (this.form.paymentMethod === 'VIREMENT' &&
        !this.selectedVirement) return false;
    if (this.form.paymentMethod === 'CASH' &&
        !this.deliveryChoice) return false;
    return true;
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    this.loading = true;
    this.paymentRef = 'REF-' + Date.now();

    const order: Order = {
      buyerId: 1,
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      address: this.form.address,
      phone: this.form.phone,
      paymentMethod: this.form.paymentMethod,
      totalAmount: this.total,
      items: this.items
    };

    this.orderService.create(order).subscribe({
      next: (res) => {
        this.orderId = res.id!;
        this.confirmed = true;
        this.cartService.clearCart();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  goHome(): void {
    this.router.navigate(['/furniture']);
  }
}
