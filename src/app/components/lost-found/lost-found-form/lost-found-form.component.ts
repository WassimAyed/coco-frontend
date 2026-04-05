import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LostFoundService, LostItem, LostItemRequest } from '../../../services/lost-found.service';

@Component({
  selector: 'app-lost-found-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lost-found-form.component.html'
})
export class LostFoundFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  isEditMode = false;
  itemId: number | null = null;

  categories = ['Electronics', 'Documents', 'Accessories', 'Clothing', 'Other'];
  types: Array<'LOST' | 'FOUND'> = ['LOST', 'FOUND'];
  locations = ['Campus A', 'Campus B', 'Library', 'Cafeteria', 'Parking'];

  constructor(
    private fb: FormBuilder,
    private lostFoundService: LostFoundService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.itemId = params['id'];
        this.loadItem(params['id']);
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['LOST', Validators.required],
      category: ['', Validators.required],
      location: ['', Validators.required],
      contactInfo: ['', Validators.required],
      imageUrl: ['']
    });
  }

  loadItem(id: number): void {
    this.loading = true;
    this.lostFoundService.getItemById(id).subscribe({
      next: (item: LostItem) => {
        this.form.patchValue({
          title: item.title,
          description: item.description,
          type: item.type,
          category: item.category,
          location: item.location,
          contactInfo: item.contactInfo,
          imageUrl: item.imageUrl
        });
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = 'Failed to load item';
        console.error(error);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = null;

    const request: LostItemRequest = this.form.value;

    const operation = this.isEditMode
      ? this.lostFoundService.updateItem(this.itemId!, request)
      : this.lostFoundService.createItem(request);

    operation.subscribe({
      next: () => {
        this.loading = false;
        const message = this.isEditMode ? 'Item updated successfully!' : 'Item created successfully!';
        alert(message);
        this.router.navigate(['/lost-found']);
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = this.isEditMode ? 'Failed to update item' : 'Failed to create item';
        console.error(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/lost-found']);
  }

  get isFormValid(): boolean {
    return this.form.valid && !this.loading;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) {
      return `${this.formatFieldName(fieldName)} is required`;
    }
    if (field.errors['minlength']) {
      return `${this.formatFieldName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return null;
  }

  private formatFieldName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
