import * as THREE from 'three';

import { RadialTexture } from './aux/radial-texture';

export class Grid extends THREE.Points {
  constructor() {
    super(Grid.geometry(), Grid.material());
  }

  get opacity(): number {
    return (this.material as THREE.PointsMaterial).opacity;
  }

  set opacity(value: number) {
    (this.material as THREE.PointsMaterial).opacity = value;
  }

  static geometry(): THREE.BufferGeometry {
    const vertices: number[] = [];

    for (let y = -2; y <= 2; y++) {
      for (let x = -48; x <= 48; x++) {
        for (let z = -48; z <= 48; z++) {
          vertices.push(x * 8, y * 100, z * 8);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  static material(): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: new RadialTexture().easeInTo(0.5, 0.5).easeOutTo(1, 1).render(),
    });
  }
}
