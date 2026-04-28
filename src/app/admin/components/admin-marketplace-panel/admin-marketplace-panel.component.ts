import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ShoppingBag,
  Package,
  CheckCircle,
  Archive,
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  Plus,
  Edit2,
} from 'lucide-angular';
import { FurnitureService } from '../../../real-estate/services/furniture.service';
import { Furniture } from '../../../real-estate/models/furniture';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-marketplace-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-marketplace-panel.component.html',
})
export class AdminMarketplacePanelComponent implements OnInit {
  private readonly furnitureService = inject(FurnitureService);
  private readonly toast = inject(ToastService);

  readonly ShoppingBagIcon = ShoppingBag;
  readonly PackageIcon = Package;
  readonly CheckIcon = CheckCircle;
  readonly ArchiveIcon = Archive;
  readonly TrashIcon = Trash2;
  readonly RefreshIcon = RefreshCw;
  readonly SearchIcon = Search;
  readonly AlertIcon = AlertTriangle;
  readonly PlusIcon = Plus;
  readonly EditIcon = Edit2;

  items: Furniture[] = [];
  filtered: Furniture[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  statusFilter: '' | 'AVAILABLE' | 'SOLD' | 'ARCHIVED' = '';
  deletingId: number | null = null;

  showForm = false;
  editMode = false;
  editId: number | null = null;
  formError = '';
  form = {
    title: '',
    description: '',
    category: '',
    condition: 'GOOD' as string,
    price: 0,
    quantity: 1,
    status: 'AVAILABLE' as 'AVAILABLE' | 'SOLD' | 'ARCHIVED',
    sellerId: 1,
    imageUrl: ''
  };

  readonly conditions: string[] = ['NEW', 'GOOD', 'FAIR', 'USED', 'POOR'];
  readonly statuses: Array<'AVAILABLE' | 'SOLD' | 'ARCHIVED'> = ['AVAILABLE', 'SOLD', 'ARCHIVED'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.furnitureService.getAll().subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.filtered = [];
        this.error =
          'Impossible de charger les articles. Vérifiez que le service realEstateService (port 8099) est démarré.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.items.filter((it) => {
      const matchTerm =
        !term ||
        it.title?.toLowerCase().includes(term) ||
        it.description?.toLowerCase().includes(term) ||
        it.category?.toLowerCase().includes(term);
      const matchStatus = !this.statusFilter || it.status === this.statusFilter;
      return matchTerm && matchStatus;
    });
  }

  get totalCount(): number {
    return this.items.length;
  }
  get availableCount(): number {
    return this.items.filter((i) => i.status === 'AVAILABLE').length;
  }
  get soldCount(): number {
    return this.items.filter((i) => i.status === 'SOLD').length;
  }
  get archivedCount(): number {
    return this.items.filter((i) => i.status === 'ARCHIVED').length;
  }

  get categoryBreakdown(): { name: string; count: number }[] {
    const map = new Map<string, number>();
    this.items.forEach((i) => {
      const key = i.category || 'OTHER';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
    this.editMode = false;
    this.formError = '';
  }

  openEditForm(item: Furniture): void {
    this.editId = item.id ?? null;
    this.showForm = true;
    this.editMode = true;
    this.formError = '';
    this.form = {
      title: item.title,
      description: item.description,
      category: item.category,
      condition: item.condition,
      price: item.price,
      quantity: item.quantity,
      status: (item.status as 'AVAILABLE' | 'SOLD' | 'ARCHIVED') || 'AVAILABLE',
      sellerId: item.sellerId,
      imageUrl: item.imageUrl || ''
    };
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = { title: '', description: '', category: '', condition: 'GOOD', price: 0, quantity: 1, status: 'AVAILABLE', sellerId: 1, imageUrl: '' };
    this.editId = null;
    this.formError = '';
  }

  validateForm(): boolean {
    if (!this.form.title.trim()) { this.formError = 'Le titre est obligatoire.'; return false; }
    if (!this.form.description.trim()) { this.formError = 'La description est obligatoire.'; return false; }
    if (!this.form.category.trim()) { this.formError = 'La catégorie est obligatoire.'; return false; }
    if (this.form.price < 0) { this.formError = 'Le prix doit être positif.'; return false; }
    if (this.form.quantity < 1) { this.formError = 'La quantité doit être au moins 1.'; return false; }
    return true;
  }

  submitForm(): void {
    this.formError = '';
    if (!this.validateForm()) return;
    const payload = {
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      category: this.form.category.trim(),
      condition: this.form.condition,
      price: Number(this.form.price),
      quantity: Number(this.form.quantity),
      status: this.form.status,
      sellerId: Number(this.form.sellerId) || 1,
      imageUrl: this.form.imageUrl.trim() || null
    } as any;
    if (this.editMode && this.editId) {
      this.furnitureService.update(this.editId, payload).subscribe({
        next: () => {
          this.toast.success('Article modifié avec succès.', 'Marketplace');
          this.cancelForm();
          this.load();
        },
        error: () => this.toast.error('Impossible de modifier l\'article.', 'Marketplace')
      });
    } else {
      this.furnitureService.create(payload).subscribe({
        next: () => {
          this.toast.success('Article ajouté avec succès.', 'Marketplace');
          this.cancelForm();
          this.load();
        },
        error: () => this.toast.error('Impossible d\'ajouter l\'article.', 'Marketplace')
      });
    }
  }

  remove(item: Furniture): void {
    if (!item?.id) return;
    if (!confirm(`Supprimer "${item.title}" ?`)) return;
    this.deletingId = item.id;
    this.furnitureService.delete(item.id).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.id !== item.id);
        this.applyFilters();
        this.deletingId = null;
        this.toast.success('Article supprimé.', 'Marketplace');
      },
      error: () => {
        this.deletingId = null;
        this.toast.error('Suppression impossible.', 'Marketplace');
      },
    });
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'SOLD':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ARCHIVED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }
}
