import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';

interface CursorTrailPoint {
  alpha: number;
  size: number;
  x: number;
  y: number;
}

interface SplashParticle {
  alpha: number;
  life: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface SplashRing {
  alpha: number;
  life: number;
  lineWidth: number;
  radius: number;
  x: number;
  y: number;
}

@Component({
  standalone: false,
  selector: 'app-ambient-background',
  template: `
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background"></div>

      @if (enableCursor) {
        <canvas #cursorCanvas class="absolute inset-0 h-full w-full"></canvas>
      }

      <div
        class="absolute -left-24 -top-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl transition-all duration-[1400ms] ease-out"
        [class.-translate-x-12]="!mounted()"
        [class.-translate-y-10]="!mounted()"
        [class.opacity-0]="!mounted()"
        [class.scale-75]="!mounted()"
        [class.opacity-100]="mounted()"
        [class.scale-100]="mounted()"
      ></div>

      <div
        class="absolute right-[-6rem] top-1/4 h-72 w-72 rounded-full bg-sidebar-primary/15 blur-3xl transition-all delay-150 duration-[1500ms] ease-out"
        [class.translate-x-10]="!mounted()"
        [class.opacity-0]="!mounted()"
        [class.scale-90]="!mounted()"
        [class.opacity-100]="mounted()"
        [class.scale-100]="mounted()"
      ></div>

      <div
        class="absolute bottom-[-8rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent blur-3xl transition-all delay-300 duration-[1600ms] ease-out"
        [class.translate-y-16]="!mounted()"
        [class.opacity-0]="!mounted()"
        [class.scale-90]="!mounted()"
        [class.opacity-70]="mounted()"
        [class.scale-100]="mounted()"
      ></div>

      <div class="absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]">
        <div
          class="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:5rem_5rem] transition-opacity duration-[1800ms]"
          [class.opacity-0]="!mounted()"
          [class.opacity-100]="mounted()"
        ></div>
      </div>
    </div>
  `
})
export class AmbientBackgroundComponent implements OnInit, AfterViewInit {
  @ViewChild('cursorCanvas') private readonly cursorCanvas?: ElementRef<HTMLCanvasElement>;
  @Input() enableCursor = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  readonly mounted = signal(false);
  readonly cursorVisible = signal(false);
  readonly cursorX = signal(0);
  readonly cursorY = signal(0);

  private animationFrameId: number | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private lastPointerAt = 0;
  private primaryColor = '153, 27, 27';
  private secondaryColor = '2, 6, 23';
  private splashRings: SplashRing[] = [];
  private splashParticles: SplashParticle[] = [];
  private trailPoints: CursorTrailPoint[] = [];

  ngOnInit(): void {
    setTimeout(() => {
      this.mounted.set(true);
    });
  }

  ngAfterViewInit(): void {
    if (!this.enableCursor || !this.cursorCanvas) {
      return;
    }

    this.setupCanvas();
    this.ngZone.runOutsideAngular(() => {
      this.startAnimationLoop();
    });

    this.destroyRef.onDestroy(() => {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  @HostListener('window:pointermove', ['$event'])
  handlePointerMove(event: PointerEvent): void {
    if (!this.enableCursor) {
      return;
    }

    this.cursorX.set(event.clientX);
    this.cursorY.set(event.clientY);
    this.cursorVisible.set(true);

    this.trailPoints.unshift({
      alpha: 0.24,
      size: 110,
      x: event.clientX,
      y: event.clientY
    });

    if (this.trailPoints.length > 18) {
      this.trailPoints.length = 18;
    }

    const now = performance.now();
    if (now - this.lastPointerAt < 30) {
      return;
    }

    this.lastPointerAt = now;
    this.spawnSplash(event.clientX, event.clientY, 5);
  }

  @HostListener('window:pointerleave')
  @HostListener('window:blur')
  handlePointerLeave(): void {
    this.cursorVisible.set(false);
  }

  @HostListener('window:pointerdown', ['$event'])
  handlePointerDown(event: PointerEvent): void {
    if (!this.enableCursor) {
      return;
    }

    this.spawnSplash(event.clientX, event.clientY, 9);
    this.spawnRing(event.clientX, event.clientY, 0);
    this.spawnRing(event.clientX, event.clientY, 18);
  }

  @HostListener('window:resize')
  handleResize(): void {
    this.setupCanvas();
  }

  private setupCanvas(): void {
    const canvas = this.cursorCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.canvasContext = context;

    const styles = getComputedStyle(document.documentElement);
    this.primaryColor = this.toRgb(styles.getPropertyValue('--primary').trim(), '153, 27, 27');
    this.secondaryColor = this.toRgb(styles.getPropertyValue('--sidebar-primary').trim(), '2, 6, 23');
  }

  private startAnimationLoop(): void {
    const tick = () => {
      this.renderFrame();
      this.animationFrameId = requestAnimationFrame(tick);
    };

    tick();
  }

  private renderFrame(): void {
    const canvas = this.cursorCanvas?.nativeElement;
    const context = this.canvasContext;

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'lighter';

    for (const trailPoint of this.trailPoints) {
      this.drawGlow(context, trailPoint.x, trailPoint.y, trailPoint.size, this.primaryColor, trailPoint.alpha);
      trailPoint.size *= 0.965;
      trailPoint.alpha *= 0.92;
    }

    this.trailPoints = this.trailPoints.filter((trailPoint) => trailPoint.alpha > 0.02);

    for (const particle of this.splashParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.life += 1;
      particle.alpha *= 0.95;
      particle.size *= 0.992;

      this.drawGlow(context, particle.x, particle.y, particle.size, this.secondaryColor, particle.alpha);
      this.drawGlow(context, particle.x, particle.y, particle.size * 0.55, this.primaryColor, particle.alpha * 0.95);
    }

    this.splashParticles = this.splashParticles.filter((particle) => particle.alpha > 0.03 && particle.life < 36);

    for (const ring of this.splashRings) {
      ring.life += 1;
      ring.radius += 2.6;
      ring.alpha *= 0.945;
      ring.lineWidth *= 0.986;

      context.beginPath();
      context.strokeStyle = `rgba(${this.primaryColor}, ${ring.alpha})`;
      context.lineWidth = ring.lineWidth;
      context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      context.stroke();
    }

    this.splashRings = this.splashRings.filter((ring) => ring.alpha > 0.03 && ring.life < 32);

    if (this.cursorVisible()) {
      this.drawGlow(context, this.cursorX(), this.cursorY(), 72, this.primaryColor, 0.18);
      this.drawGlow(context, this.cursorX(), this.cursorY(), 34, this.secondaryColor, 0.15);
    }

    context.globalCompositeOperation = 'source-over';
  }

  private drawGlow(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rgbColor: string,
    alpha: number
  ): void {
    const gradient = context.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(${rgbColor}, ${alpha})`);
    gradient.addColorStop(0.45, `rgba(${rgbColor}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }

  private spawnSplash(x: number, y: number, count: number): void {
    const nextParticles = Array.from({ length: count }, (_, index) => {
      const angle = ((Math.PI * 2) / count) * index + Math.random() * 0.6;
      const velocity = 1.8 + Math.random() * 2.6;

      return {
        alpha: 0.24 + Math.random() * 0.22,
        life: 0,
        size: 40 + Math.random() * 34,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        x,
        y
      };
    });

    this.splashParticles.push(...nextParticles);
    if (this.splashParticles.length > 48) {
      this.splashParticles = this.splashParticles.slice(-48);
    }
  }

  private spawnRing(x: number, y: number, delayMs: number): void {
    setTimeout(() => {
      this.splashRings.push({
        alpha: 0.2,
        life: 0,
        lineWidth: 8,
        radius: 12,
        x,
        y
      });

      if (this.splashRings.length > 12) {
        this.splashRings = this.splashRings.slice(-12);
      }
    }, delayMs);
  }

  private toRgb(input: string, fallback: string): string {
    if (!input) {
      return fallback;
    }

    const normalized = input.trim();
    if (normalized.startsWith('#')) {
      const hex = normalized.slice(1);
      const safeHex = hex.length === 3
        ? hex
            .split('')
            .map((value) => value + value)
            .join('')
        : hex;

      const red = parseInt(safeHex.slice(0, 2), 16);
      const green = parseInt(safeHex.slice(2, 4), 16);
      const blue = parseInt(safeHex.slice(4, 6), 16);

      return `${red}, ${green}, ${blue}`;
    }

    const rgbMatch = normalized.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      return `${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}`;
    }

    return fallback;
  }
}

