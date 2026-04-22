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

  items: Furniture[] = [];
  filtered: Furniture[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  statusFilter: '' | 'AVAILABLE' | 'SOLD' | 'ARCHIVED' = '';
  deletingId: number | null = null;

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
