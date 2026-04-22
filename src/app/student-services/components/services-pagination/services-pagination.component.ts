import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-services-pagination',
  templateUrl: './services-pagination.component.html',
})
export class ServicesPaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 1;
  @Input() itemLabel = 'items';
  @Output() readonly pageChange = new EventEmitter<number>();

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.pageChange.emit(page);
  }
}

