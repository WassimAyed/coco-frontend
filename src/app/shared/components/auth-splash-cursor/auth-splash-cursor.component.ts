import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-auth-splash-cursor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas
      #fluidCanvas
      class="pointer-events-none absolute inset-0 h-full w-full opacity-90"
      aria-hidden="true"
    ></canvas>
  `
})
export class AuthSplashCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('fluidCanvas', { static: true }) private readonly fluidCanvas!: ElementRef<HTMLCanvasElement>;

  private initialized = false;
  private cleanupWindowListeners: Array<() => void> = [];

  async ngAfterViewInit(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const { default: WebGLFluid } = await import('webgl-fluid');
    const canvas = this.fluidCanvas.nativeElement;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    WebGLFluid(canvas, {
      AUTO: false,
      BACK_COLOR: { b: 255, g: 255, r: 255 },
      BLOOM: true,
      BLOOM_INTENSITY: 0.55,
      BLOOM_ITERATIONS: 8,
      BLOOM_RESOLUTION: 256,
      BLOOM_SOFT_KNEE: 0.7,
      BLOOM_THRESHOLD: 0.6,
      CAPTURE_RESOLUTION: 512,
      COLORFUL: true,
      COLOR_UPDATE_SPEED: 8,
      CURL: 28,
      DENSITY_DISSIPATION: 1,
      DYE_RESOLUTION: 1024,
      IMMEDIATE: true,
      INTERVAL: 3000,
      PAUSED: false,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 20,
      SHADING: true,
      SIM_RESOLUTION: 128,
      SPLAT_COUNT: 8,
      SPLAT_FORCE: 5200,
      SPLAT_RADIUS: 0.2,
      SUNRAYS: true,
      SUNRAYS_RESOLUTION: 196,
      SUNRAYS_WEIGHT: 0.65,
      TRANSPARENT: true,
      TRIGGER: 'hover',
      VELOCITY_DISSIPATION: 0.22
    });

    this.bindPointerBridge(canvas);
  }

  ngOnDestroy(): void {
    this.cleanupWindowListeners.forEach((cleanup) => cleanup());
    this.cleanupWindowListeners = [];
    this.fluidCanvas.nativeElement.width = 0;
    this.fluidCanvas.nativeElement.height = 0;
  }

  private bindPointerBridge(canvas: HTMLCanvasElement): void {
    const forwardMouseMove = (event: PointerEvent) => {
      canvas.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY
      }));
    };

    const forwardTouchLikeLeave = () => {
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    };

    window.addEventListener('pointermove', forwardMouseMove, { passive: true });
    window.addEventListener('pointerleave', forwardTouchLikeLeave);
    window.addEventListener('blur', forwardTouchLikeLeave);

    this.cleanupWindowListeners.push(() => window.removeEventListener('pointermove', forwardMouseMove));
    this.cleanupWindowListeners.push(() => window.removeEventListener('pointerleave', forwardTouchLikeLeave));
    this.cleanupWindowListeners.push(() => window.removeEventListener('blur', forwardTouchLikeLeave));
  }
}
