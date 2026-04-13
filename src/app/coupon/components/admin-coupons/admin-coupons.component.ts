import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-coupons.component.html',
  styleUrls: ['./admin-coupons.component.css']
})
export class AdminCouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  filteredCoupons: Coupon[] = [];
  message = '';
  messageType = '';
  showForm = false;
  editMode = false;
  editId: number | null = null;
  searchTerm = '';

  form = {
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    category: 'CINEMA',
    expirationDate: '',
    maxUsage: 100,
    imageUrl: '',
    partnerName: ''
  };

  categories = ['CINEMA', 'RESTAURANT', 'TRANSPORT', 'SUBSCRIPTION', 'FITNESS', 'SHOPPING', 'COWORKING', 'OTHER'];

  constructor(private couponService: CouponService) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.couponService.getAllCoupons().subscribe({
      next: (data) => {
        this.coupons = data;
        this.filteredCoupons = data;
      },
      error: (err) => this.showMessage('Erreur de chargement', 'error')
    });
  }

  filterCoupons(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCoupons = this.coupons.filter(c =>
      c.code.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.partnerName?.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term)
    );
  }

  exportPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Liste des Coupons - CoCo Platform', 14, 22);
    doc.setFontSize(10);
    doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR'), 14, 30);

    const rows = this.filteredCoupons.map(c => [
      c.code,
      c.title,
      c.discountType === 'PERCENTAGE' ? c.discountValue + '%' : c.discountValue + ' DT',
      c.category,
      c.currentUsage + '/' + c.maxUsage,
      c.isActive ? 'Actif' : 'Inactif',
      new Date(c.expirationDate).toLocaleDateString('fr-FR')
    ]);

    autoTable(doc, {
      head: [['Code', 'Titre', 'Reduction', 'Categorie', 'Usage', 'Statut', 'Expiration']],
      body: rows,
      startY: 36,
      theme: 'grid',
      headStyles: { fillColor: [233, 69, 96] },
      styles: { fontSize: 9 }
    });

    doc.save('coupons-coco.pdf');
  }
  openAddForm(): void {
    
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
  }

  openEditForm(coupon: Coupon): void {
    this.editMode = true;
    this.editId = coupon.id;
    this.showForm = true;
    this.form = {
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      category: coupon.category,
      expirationDate: coupon.expirationDate.substring(0, 16),
      maxUsage: coupon.maxUsage,
      imageUrl: coupon.imageUrl || '',
      partnerName: coupon.partnerName || ''
    };
  }

  submitForm(): void {
    let expDate = this.form.expirationDate;
    if (expDate && expDate.length === 16) {
      expDate = expDate + ':00';
    }

    const payload = {
      code: this.form.code,
      title: this.form.title,
      description: this.form.description,
      discountType: this.form.discountType,
      discountValue: this.form.discountValue,
      category: this.form.category,
      expirationDate: expDate,
      maxUsage: this.form.maxUsage,
      imageUrl: this.form.imageUrl || null,
      partnerName: this.form.partnerName || null
    };

    if (this.editMode && this.editId) {
      this.couponService.updateCoupon(this.editId, payload).subscribe({
        next: () => {
          this.showMessage('Coupon modifie avec succes!', 'success');
          this.showForm = false;
          this.loadCoupons();
        },
        error: (err) => this.showMessage(err.error?.message || JSON.stringify(err.error) || 'Erreur de modification', 'error')
      });
    } else {
      this.couponService.createCoupon(payload).subscribe({
        next: () => {
          this.showMessage('Coupon cree avec succes!', 'success');
          this.showForm = false;
          this.loadCoupons();
        },
        error: (err) => this.showMessage(err.error?.message || JSON.stringify(err.error) || 'Erreur de creation', 'error')
      });
    }
  }

  deleteCoupon(id: number): void {
    if (confirm('Supprimer ce coupon ?')) {
      this.couponService.deleteCoupon(id).subscribe({
        next: () => {
          this.showMessage('Coupon supprime!', 'success');
          this.loadCoupons();
        },
        error: () => this.showMessage('Erreur de suppression', 'error')
      });
    }
  }

  toggleStatus(id: number): void {
    this.couponService.toggleCouponStatus(id).subscribe({
      next: () => this.loadCoupons(),
      error: () => this.showMessage('Erreur', 'error')
    });
  }

  resetForm(): void {
    this.form = {
      code: '', title: '', description: '',
      discountType: 'PERCENTAGE', discountValue: 0,
      category: 'CINEMA', expirationDate: '',
      maxUsage: 100, imageUrl: '', partnerName: ''
    };
    this.editId = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  showMessage(msg: string, type: string): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }
}