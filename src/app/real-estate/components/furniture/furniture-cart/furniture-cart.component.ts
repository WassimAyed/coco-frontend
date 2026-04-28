import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderItem } from '../../../models/order.model';

@Component({
  selector: 'app-furniture-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './furniture-cart.component.html',
  styleUrls: ['./furniture-cart.component.scss']
})
export class FurnitureCartComponent implements OnInit {
  items: OrderItem[] = [];
  total = 0;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
      this.items = items;
      this.total = this.cartService.getTotal();
    });
  }

  removeItem(furnitureId: number): void {
    this.cartService.removeItem(furnitureId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  checkout(): void {
    this.router.navigate(['/furniture/checkout']);
  }
}
