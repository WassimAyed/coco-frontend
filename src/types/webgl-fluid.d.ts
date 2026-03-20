declare module 'webgl-fluid' {
  interface WebGLFluidOptions {
    AUTO?: boolean;
    BACK_COLOR?: { b: number; g: number; r: number };
    BLOOM?: boolean;
    BLOOM_INTENSITY?: number;
    BLOOM_ITERATIONS?: number;
    BLOOM_RESOLUTION?: number;
    BLOOM_SOFT_KNEE?: number;
    BLOOM_THRESHOLD?: number;
    CAPTURE_RESOLUTION?: number;
    COLORFUL?: boolean;
    COLOR_UPDATE_SPEED?: number;
    CURL?: number;
    DENSITY_DISSIPATION?: number;
    DYE_RESOLUTION?: number;
    IMMEDIATE?: boolean;
    INTERVAL?: number;
    PAUSED?: boolean;
    PRESSURE?: number;
    PRESSURE_ITERATIONS?: number;
    SHADING?: boolean;
    SIM_RESOLUTION?: number;
    SPLAT_COUNT?: number;
    SPLAT_FORCE?: number;
    SPLAT_RADIUS?: number;
    SUNRAYS?: boolean;
    SUNRAYS_RESOLUTION?: number;
    SUNRAYS_WEIGHT?: number;
    TRANSPARENT?: boolean;
    TRIGGER?: 'click' | 'hover';
    VELOCITY_DISSIPATION?: number;
  }

  export default function WebGLFluid(canvas: HTMLCanvasElement, options?: WebGLFluidOptions): void;
}
