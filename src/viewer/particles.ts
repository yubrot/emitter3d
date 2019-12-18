import * as THREE from 'three';

import { RadialTexture } from './aux/radial-texture';

export class Particles extends THREE.Points {
  private positions: THREE.BufferAttribute;
  private colors: THREE.BufferAttribute;

  get buffer(): THREE.BufferGeometry {
    return this.geometry as THREE.BufferGeometry;
  }

  get mat(): ParticlesMaterial {
    return this.material as ParticlesMaterial;
  }

  constructor(private capacity: number) {
    super(new THREE.BufferGeometry(), new ParticlesMaterial());
    this.positions = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    this.colors = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    this.positions.setUsage(THREE.DynamicDrawUsage);
    this.colors.setUsage(THREE.DynamicDrawUsage);
    this.buffer.setAttribute('position', this.positions);
    this.buffer.setAttribute('color', this.colors);
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

export class ParticlesMaterial extends THREE.PointsMaterial {
  constructor() {
    super({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  private coreWidth = 0.5;
  private coreSharpness = 0;
  private shellLightness = 0.5;

  mapNeedsUpdate = true;

  changeOptions(
    sizeAttenuation: boolean,
    coreRadius: number,
    coreSharpness: number,
    shellRadius: number,
    shellLightness: number): void {
    this.needsUpdate = this.sizeAttenuation != sizeAttenuation;
    this.sizeAttenuation = sizeAttenuation;

    this.size = (coreRadius + shellRadius) * 2;
    const coreWidth = coreRadius / (coreRadius + shellRadius);
    this.mapNeedsUpdate =
      this.mapNeedsUpdate ||
      this.coreWidth != coreWidth ||
      this.coreSharpness != coreSharpness ||
      this.shellLightness != shellLightness;
    this.coreWidth = coreWidth;
    this.coreSharpness = coreSharpness;
    this.shellLightness = shellLightness;
  }

  updateMap(): void {
    if (!this.mapNeedsUpdate) return;
    this.map = new RadialTexture()
      .easeInTo(1 - this.coreWidth, this.shellLightness)
      .easeOutTo(1, 1, 2 ** Math.exp(this.coreSharpness))
      .render();
    this.mapNeedsUpdate = false;
  }
}
