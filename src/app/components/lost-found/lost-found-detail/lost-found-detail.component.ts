import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LostFoundService, LostItem } from '../../../services/lost-found.service';

@Component({
  selector: 'app-lost-found-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lost-found-detail.component.html'
})
export class LostFoundDetailComponent implements OnInit {
  item: LostItem | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private lostFoundService: LostFoundService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadItem(params['id']);
      }
    });
  }

  loadItem(id: number): void {
    this.loading = true;
    this.lostFoundService.getItemById(id).subscribe({
      next: (item: any) => {
        this.item = item;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load item';
        console.error(error);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/lost-found']);
  }

  editItem(): void {
    this.router.navigate(['/lost-found/edit', this.item!.id]);
  }

  deleteItem(): void {
    if (confirm('Are you sure you want to delete this item?')) {
      this.lostFoundService.deleteItem(this.item!.id).subscribe({
        next: () => {
          alert('Item deleted successfully');
          this.goBack();
        },
        error: (error: any) => {
          this.error = 'Failed to delete item';
          console.error(error);
        }
      });
    }
  }

  markAsResolved(): void {
    this.lostFoundService.markAsResolved(this.item!.id).subscribe({
      next: () => {
        alert('Item marked as resolved');
        this.loadItem(this.item!.id);
      },
      error: (error: any) => {
        this.error = 'Failed to mark item as resolved';
        console.error(error);
      }
    });
  }

  copyContactInfo(): void {
    if (this.item?.contactInfo) {
      navigator.clipboard.writeText(this.item.contactInfo);
      alert('Contact info copied to clipboard');
    }
  }
}
