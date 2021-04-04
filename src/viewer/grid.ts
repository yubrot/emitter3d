import * as THREE from 'three';

import { RadialTexture } from './aux/radial-texture';

export class Grid extends THREE.Points {
  constructor() {
    super(Grid.geometry(), Grid.material());
  }

  static geometry(): THREE.BufferGeometry {
    const vertices: number[] = [];

    for (let x = -32; x <= 32; x++) {
      for (let z = -32; z <= 32; z++) {
        vertices.push(x * 8, 0, z * 8);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  static material(): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: 0x666666,
      size: 1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: new RadialTexture().easeInTo(0.5, 0.5).easeOutTo(1, 1).render(),
    });
  }
}
