import * as THREE from 'three';

// TODO: Avoid banding
export class RadialTexture {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly gradient: CanvasGradient;

  constructor(readonly resolution = 512, readonly division = 4) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = resolution;
    this.canvas.height = resolution;

    this.context = this.canvas.getContext('2d')!;
    const r = resolution / 2;
    this.gradient = this.context.createRadialGradient(r, r, 0, r, r, r);
  }

  private px = 0;
  private py = 0;

  moveTo(x: number, y: number, f: (t: number) => number = t => t): this {
    const s = this.resolution / this.division;
    x = Math.floor(x * s);
    y = Math.floor(y * s);
    if (x == this.px) return this;
    for (let i = this.px == 0 ? 0 : this.px + 1; i <= x; ++i) {
      const t = (i - this.px) / (x - this.px);
      const offset = s - i;
      const alpha = f(t) * (y - this.py) + this.py;
      this.gradient.addColorStop(offset / s, `rgba(255, 255, 255, ${alpha / s})`);
    }
    this.px = x;
    this.py = y;
    return this;
  }

  easeInTo(x: number, y: number, p = 2): this {
    return this.moveTo(x, y, t => t ** p);
  }

  easeOutTo(x: number, y: number, p = 2): this {
    return this.moveTo(x, y, t => 1 - Math.abs(t - 1) ** p);
  }

  render(): THREE.Texture {
    this.context.fillStyle = this.gradient;
    this.context.fillRect(0, 0, this.resolution, this.resolution);

    const texture = new THREE.Texture(this.canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
