import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LostFoundService, LostItem, LostItemRequest } from '../../services/lost-found.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lost-found-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lost-found-list.component.html',
  styleUrls: ['./lost-found-list.component.css']
})
export class LostFoundListComponent implements OnInit {
  items: LostItem[] = [];
  filteredItems: LostItem[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Filtres
  filterType: 'LOST' | 'FOUND' | 'ALL' = 'ALL';
  filterCategory = '';
  filterLocation = '';
  searchQuery = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;

  categories = ['Electronics', 'Documents', 'Accessories', 'Clothing', 'Other'];
  locations = ['Campus A', 'Campus B', 'Library', 'Cafeteria', 'Parking'];

  constructor(
    private lostFoundService: LostFoundService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;

    this.lostFoundService.getAllItems(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.items = response.content || response;
        this.totalItems = response.totalElements || response.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load items';
        console.error(error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredItems = this.items.filter(item => {
      const matchesType = this.filterType === 'ALL' || item.type === this.filterType;
      const matchesCategory = !this.filterCategory || item.category === this.filterCategory;
      const matchesLocation = !this.filterLocation || item.location === this.filterLocation;
      const matchesSearch = !this.searchQuery || 
        item.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesType && matchesCategory && matchesLocation && matchesSearch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  viewItem(item: LostItem): void {
    this.router.navigate(['/lost-found/detail', item.id]);
  }

  editItem(item: LostItem): void {
    if (item.isOwner) {
      this.router.navigate(['/lost-found/edit', item.id]);
    } else {
      this.error = 'You can only edit your own items';
    }
  }

  deleteItem(item: LostItem): void {
    if (!item.isOwner) {
      this.error = 'You can only delete your own items';
      return;
    }

    if (confirm('Are you sure you want to delete this item?')) {
      this.lostFoundService.deleteItem(item.id).subscribe({
        next: () => {
          this.successMessage = 'Item deleted successfully';
          this.loadItems();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.error = 'Failed to delete item';
          console.error(error);
        }
      });
    }
  }

  markAsResolved(item: LostItem): void {
    if (!item.isOwner) {
      this.error = 'You can only mark your own items as resolved';
      return;
    }

    this.lostFoundService.markAsResolved(item.id).subscribe({
      next: () => {
        this.successMessage = 'Item marked as resolved';
        this.loadItems();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.error = 'Failed to mark item as resolved';
        console.error(error);
      }
    });
  }

  createNewItem(): void {
    this.router.navigate(['/lost-found/create']);
  }

  viewMyItems(): void {
    this.router.navigate(['/lost-found/my-items']);
  }

  resetFilters(): void {
    this.filterType = 'ALL';
    this.filterCategory = '';
    this.filterLocation = '';
    this.searchQuery = '';
    this.applyFilters();
  }
}
