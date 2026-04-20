import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { UserService } from '../../../user-security/services/user.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-create-profile',

  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.css'],
})
export class CreateProfileComponent implements OnInit {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private userService = inject(UserService);

  isLoading = false;

  form = this.fb.group({
    age: [null, [Validators.required, Validators.min(18)]],
    gender: ['', Validators.required],
    budget: [null, Validators.required],
    city: ['', Validators.required],
    smoker: [false],
    pets: [false],
    cleanliness: [3],
    sleepSchedule: ['', Validators.required],
    studyLevel: ['', Validators.required],
    interests: [''],
    socialLevel: [3],
    acceptsGuests: [false],
    noiseTolerance: [3],
  });

  ngOnInit(): void {
    console.log('✅ Current user on init:', this.userService.currentUser());
  }

  submit(): void {

    console.log('🔥 SUBMIT CLICKED');

    const user = this.userService.currentUser();

    console.log('👤 USER FROM SERVICE:', user);

    if (!user || !user.id) {
      console.error('❌ USER ID MISSING');
      this.toast.error('User not loaded yet');
      return;
    }

    if (this.form.invalid) {
      console.warn('❌ FORM INVALID', this.form.value);
      this.toast.error('Fill required fields');
      return;
    }

    if (!this.userService.currentSession()?.accessToken?.trim()) {
      this.toast.error('Session expired');
      void this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {

        const payload = this.buildPayload(
          user.id,
          coords.latitude,
          coords.longitude
        );

        // ⭐⭐⭐ MAIN DEBUG ⭐⭐⭐
        console.log('==============================');
        console.log('📦 PAYLOAD BEFORE API CALL');
        console.log(payload);
        console.log(JSON.stringify(payload, null, 2));
        console.log('==============================');

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });

        this.http.post(
          `${environment.apiBaseUrl.replace(/\/+$/, '')}/profiles`,
          payload,
          {
            headers,
            withCredentials: environment.auth.withCredentials,
          },
        )
          .subscribe({
           next: () => {
  console.log('✅ PROFILE CREATED');

  this.toast.success('🎉 Profile completed successfully!');

  setTimeout(() => {
    this.router.navigate(['/']);
  }, 1200);
},
            error: err => {
              console.error('❌ BACKEND ERROR:', err);
              this.isLoading = false;
            },
            complete: () => this.isLoading = false
          });
      },
      err => {
        console.error('❌ GEOLOCATION ERROR', err);
        this.isLoading = false;
      }
    );
  }

  private buildPayload(userId: string, lat: number, lng: number) {

    const v = this.form.getRawValue();

    return {
      userId: userId, // ⭐ IMPORTANT
      age: Number(v.age),
      gender: v.gender,
      budget: Number(v.budget),
      city: v.city,
      smoker: !!v.smoker,
      pets: !!v.pets,
      cleanliness: Number(v.cleanliness),
      sleepSchedule: v.sleepSchedule,
      studyLevel: v.studyLevel,
      interests: this.parseInterests(v.interests || ''),
      socialLevel: Number(v.socialLevel),
      acceptsGuests: !!v.acceptsGuests,
      noiseTolerance: Number(v.noiseTolerance),
      latitude: lat,
      longitude: lng,
    };
  }

  private parseInterests(input: string): string[] {
    return input
      ? input.split(',').map(i => i.trim()).filter(Boolean)
      : [];
  }

  cancel(): void {
  this.router.navigate(['/landing']);
}

}
