import * as THREE from 'three';

import { RadialTexture } from '../aux/radial-texture';

export class Surface extends THREE.Points {
  constructor(size: number, x: number, y: number) {
    super(new THREE.PlaneBufferGeometry(size * x * 2, size * y * 2, x * 2, y * 2), Surface.material);
    this.frustumCulled = false;
  }

  static readonly material = new THREE.PointsMaterial({
    color: 0x111111,
    map: new RadialTexture().easeInTo(0.5, 0.5).easeOutTo(0.5, 0.5).render(),
    size: 2,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
