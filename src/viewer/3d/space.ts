import * as THREE from 'three';

import { RadialTexture } from '../aux/radial-texture';

export class Space extends THREE.Points {
  constructor(readonly boundary: number, num: number) {
    super(Space.randomPointsGeometry(boundary, boundary * 1.5, num), Space.material());
  }

  static randomPointsGeometry(near: number, far: number, num: number): THREE.Geometry {
    const zero = new THREE.Vector3(0, 0, 0);
    function randomPosition(): THREE.Vector3 {
      const vec = zero.clone();
      do {
        vec.set(
          far - Math.random() * far * 2,
          far - Math.random() * far * 2,
          far - Math.random() * far * 2);
      } while (vec.distanceTo(zero) < near || far < vec.distanceTo(zero));
      return vec;
    }

    const geometry = new THREE.Geometry();
    for (let i=0; i<num; ++i) {
      const vec = randomPosition();
      const color = new THREE.Color(0, 0, 0);
      color.setHSL(((vec.x + vec.y + vec.z) * 0.0005) % 1, 1.0, 0.8);
      geometry.vertices.push(vec);
      geometry.colors.push(color);
    }
    return geometry;
  }

  static material(): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      map: new RadialTexture().easeInTo(0.5, 0.5).easeOutTo(1, 1).render(),
      vertexColors: THREE.VertexColors,
      size: 6,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
}
