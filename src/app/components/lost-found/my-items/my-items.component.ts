import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LostFoundService, LostItem } from '../../services/lost-found.service';

@Component({
  selector: 'app-my-items',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-items.component.html',
  styleUrls: ['./my-items.component.css']
})
export class MyItemsComponent implements OnInit {
  items: LostItem[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private lostFoundService: LostFoundService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserItems();
  }

  loadUserItems(): void {
    this.loading = true;
    this.error = null;

    this.lostFoundService.getUserItems().subscribe({
      next: (items: any) => {
        this.items = items;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load your items';
        console.error(error);
        this.loading = false;
      }
    });
  }

  editItem(item: LostItem): void {
    this.router.navigate(['/lost-found/edit', item.id]);
  }

  deleteItem(item: LostItem): void {
    if (confirm('Are you sure you want to delete this item?')) {
      this.lostFoundService.deleteItem(item.id).subscribe({
        next: () => {
          this.successMessage = 'Item deleted successfully';
          this.loadUserItems();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error: any) => {
          this.error = 'Failed to delete item';
          console.error(error);
        }
      });
    }
  }

  markAsResolved(item: LostItem): void {
    this.lostFoundService.markAsResolved(item.id).subscribe({
      next: () => {
        this.successMessage = 'Item marked as resolved';
        this.loadUserItems();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error: any) => {
        this.error = 'Failed to mark item as resolved';
        console.error(error);
      }
    });
  }

  viewItem(item: LostItem): void {
    this.router.navigate(['/lost-found/detail', item.id]);
  }

  createNewItem(): void {
    this.router.navigate(['/lost-found/create']);
  }

  backToList(): void {
    this.router.navigate(['/lost-found']);
  }
}
