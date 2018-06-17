import * as THREE from 'three';

import { circleTexture } from './circle-texture';

export class Particles extends THREE.Points {
  private buffer: THREE.BufferGeometry;
  private positions: THREE.BufferAttribute;
  private colors: THREE.BufferAttribute;

  constructor(private limit: number) {
    super(new THREE.BufferGeometry(), Particles.material);
    this.buffer = this.geometry as THREE.BufferGeometry;
    this.buffer.setDrawRange(0, 0);
    this.positions = new THREE.BufferAttribute(new Float32Array(limit * 3), 3);
    this.colors = new THREE.BufferAttribute(new Float32Array(limit * 3), 3);
    this.positions.setDynamic(true);
    this.colors.setDynamic(true);
    this.buffer.addAttribute('position', this.positions);
    this.buffer.addAttribute('color', this.colors);

    this.frustumCulled = false;
  }

  update(handler: (put: (position: THREE.Vector3, color: THREE.Color) => void) => void): void {
    let count = 0;

    handler((position, color) => {
      if (count >= this.limit) return;
      this.positions.setXYZ(count, position.x, position.y, position.z);
      this.colors.setXYZ(count, color.r, color.g, color.b);
      ++count;
    });

    this.buffer.setDrawRange(0, count);
    this.positions.needsUpdate = true;
    this.colors.needsUpdate = true;
  }

  static readonly material = new THREE.PointsMaterial({
    color: 0xffffff,
    map: circleTexture(),
    vertexColors: THREE.VertexColors,
    size: 5,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
