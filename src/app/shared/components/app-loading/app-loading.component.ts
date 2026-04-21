import { Component, Input, OnInit, signal } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-loading',
  templateUrl: './app-loading.component.html'
})
export class AppLoadingComponent implements OnInit {
  @Input() label = 'Loading';
  @Input() caption = 'Preparing your experience...';
  @Input() size = '8.5rem';

  readonly mounted = signal(false);

  ngOnInit(): void {
    setTimeout(() => {
      this.mounted.set(true);
    });
  }
}

