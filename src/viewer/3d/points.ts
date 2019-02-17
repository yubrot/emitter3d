import * as THREE from 'three';

import { RadialTexture } from '../aux/radial-texture';

export class Points extends THREE.Points {
  private positions: THREE.BufferAttribute;
  private colors: THREE.BufferAttribute;

  get buffer(): THREE.BufferGeometry {
    return this.geometry as THREE.BufferGeometry;
  }

  get mat(): PointsMaterial {
    return this.material as PointsMaterial;
  }

  constructor(private capacity: number) {
    super(new THREE.BufferGeometry(), new PointsMaterial());
    this.positions = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    this.colors = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    this.positions.setDynamic(true);
    this.colors.setDynamic(true);
    this.buffer.addAttribute('position', this.positions);
    this.buffer.addAttribute('color', this.colors);
    this.buffer.setDrawRange(0, 0);
    this.frustumCulled = false;
  }

  beginUpdate(): { put(position: THREE.Vector3, color: THREE.Color): void; complete(): void; } {
    let count = 0;

    return {
      put: (position, color) => {
        if (count >= this.capacity) return;
        this.positions.setXYZ(count, position.x, position.y, position.z);
        this.colors.setXYZ(count, color.r, color.g, color.b);
        ++count;
      },
      complete: () => {
        this.buffer.setDrawRange(0, count);
        this.positions.needsUpdate = true;
        this.colors.needsUpdate = true;
        this.mat.updateMap();
      },
    };
  }
}

export class PointsMaterial extends THREE.PointsMaterial {
  constructor() {
    super({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  private _shellWidth = 0.5;
  private _shellLightness = 0.5;

  get shellWidth(): number {
    return this._shellWidth;
  }

  set shellWidth(width: number) {
    this._shellWidth = width;
    this.mapNeedsUpdate = true;
  }

  get shellLightness(): number {
    return this._shellLightness;
  }

  set shellLightness(lightness: number) {
    this._shellLightness = lightness;
    this.mapNeedsUpdate = true;
  }

  mapNeedsUpdate = true;

  updateMap(): void {
    if (!this.mapNeedsUpdate) return;
    this.map = new RadialTexture()
      .easeInTo(this.shellWidth, this.shellLightness)
      .easeOutTo(1, 1, 2 ** Math.exp(this._shellWidth*2 - 1))
      .render();
    this.mapNeedsUpdate = false;
  }
}
