import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-logo',
  template: `
    <a [routerLink]="link" class="inline-flex items-center gap-2">
      <span class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary">
        <span class="absolute inset-0 bg-gradient-to-br from-primary to-black opacity-90"></span>
        <svg class="relative z-10 h-2/3 w-2/3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fill-opacity="0.9" />
          <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="flex flex-col">
        <span class="text-lg font-bold leading-none tracking-tight text-foreground">ESPRIT</span>
        <span class="-mt-0.5 text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">{{ title }}</span>
      </span>
    </a>
  `
})
export class LogoComponent {
  @Input() title = 'LIFE';
  @Input() link: string | any[] = '/';
}

