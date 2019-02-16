import * as THREE from 'three';

import { RadialTexture } from '../aux/radial-texture';

function rand(t: number): number {
  return t - Math.random() * t * 2;
}

export class Space extends THREE.Group {
  constructor(readonly near: number, readonly far: number, num: number, gnum: number, iter: number) {
    super();

    const starPositions = new THREE.BufferAttribute(new Float32Array(num * iter * 3), 3);
    const starColors = new THREE.BufferAttribute(new Float32Array(num * iter * 3), 3);
    const gasPositions = new THREE.BufferAttribute(new Float32Array(gnum * iter * 3), 3);
    const gasColors = new THREE.BufferAttribute(new Float32Array(gnum * iter * 3), 3);

    const euler = new THREE.Euler();
    const color = new THREE.Color();
    const center = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const pos = new THREE.Vector3();

    for (let i = 0; i < iter; ++i) {
      center.set((0.5 + rand(0.25)) * near, 0, 0);
      center.applyEuler(euler.set(rand(Math.PI), rand(Math.PI), rand(Math.PI)));
      rotation.setFromEuler(euler.set(rand(Math.PI), rand(Math.PI), rand(Math.PI)));

      for (let j = 0; j < num; ++j) {
        const l = Math.random() ** 0.3;
        const d = (1 - Math.random() ** (1 - l ** 0.2)) * (rand(1) > 0 ? 1 : -1);
        pos.set(near + l * (far - near), 0, 0);
        pos.applyEuler(euler.set(0, rand(Math.PI), d * Math.PI/2));
        pos.applyQuaternion(rotation);
        pos.add(center);
        color.setHSL(((pos.x + pos.y + pos.z) / (far * 3)) % 1, 0.5, 0.85);

        const idx = i * num + j;
        starPositions.setXYZ(idx, pos.x, pos.y, pos.z);
        starColors.setXYZ(idx, color.r, color.g, color.b);
      }

      for (let j = 0; j < gnum; ++j) {
        const l = 0.2 + Math.random();
        pos.set(near + l * (far - near), 0, 0);
        pos.applyEuler(euler.set(0, rand(Math.PI), rand(0.05)));
        pos.applyQuaternion(rotation);
        pos.add(center);
        color.setHSL(((pos.x + pos.y + pos.z) / (far * 3)) % 1, 0.4, 0.05 + rand(0.02));

        const idx = i * gnum + j;
        gasPositions.setXYZ(idx, pos.x, pos.y, pos.z);
        gasColors.setXYZ(idx, color.r, color.g, color.b);
      }
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.addAttribute('position', starPositions);
    starGeometry.addAttribute('color', starColors);
    const stars = new THREE.Points(starGeometry, Space.starMaterial());
    this.add(stars);

    const gasGeometry = new THREE.BufferGeometry();
    gasGeometry.addAttribute('position', gasPositions);
    gasGeometry.addAttribute('color', gasColors);
    const gases = new THREE.Points(gasGeometry, Space.gasMaterial());
    this.add(gases);
  }

  static starMaterial(): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      map: new RadialTexture().easeInTo(0.8, 0.3).easeOutTo(1, 1, 6).render(),
      vertexColors: THREE.VertexColors,
      size: 32,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  static gasMaterial(): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      map: new RadialTexture().easeInTo(0.5, 0.5).easeOutTo(1, 1).render(),
      vertexColors: THREE.VertexColors,
      size: 1024,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
}
