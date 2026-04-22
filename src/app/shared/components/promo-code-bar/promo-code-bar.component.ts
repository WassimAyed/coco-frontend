import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-promo-code-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promo-code-bar.component.html',
  styleUrls: ['./promo-code-bar.component.scss']
})
export class PromoCodeBarComponent {
  readonly originalPrice = input.required<number>();
  readonly discountApplied = output<number>();

  codeInput = '';
  readonly applied = signal(false);
  readonly errorMsg = signal('');
  readonly discountPct = signal(0);

  readonly discountedPrice = computed(() =>
    this.applied()
      ? +(this.originalPrice() * (1 - this.discountPct() / 100)).toFixed(2)
      : this.originalPrice()
  );

  readonly savings = computed(() =>
    this.applied() ? +(this.originalPrice() - this.discountedPrice()).toFixed(2) : 0
  );

  private readonly VALID_CODES: Record<string, number> = {
    PROMO10: 10,
    WELCOME15: 15,
    FLASH20: 20,
    SYRINE5: 5,
  };

  apply(): void {
    const code = this.codeInput.trim().toUpperCase();
    if (!code) {
      this.errorMsg.set('Veuillez entrer un code promo.');
      return;
    }
    const pct = this.VALID_CODES[code];
    if (pct !== undefined) {
      this.discountPct.set(pct);
      this.applied.set(true);
      this.errorMsg.set('');
      this.discountApplied.emit(this.discountedPrice());
    } else {
      this.applied.set(false);
      this.errorMsg.set('❌ Code invalide. Essayez PROMO10, FLASH20 ou SYRINE5.');
    }
  }

  reset(): void {
    this.codeInput = '';
    this.applied.set(false);
    this.errorMsg.set('');
    this.discountPct.set(0);
    this.discountApplied.emit(this.originalPrice());
  }
}
