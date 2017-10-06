import * as THREE from 'three';

import { Painter, Paint } from './resources/painter.ts';
import { Model, Rotator } from './resources/model.ts';
import { vertexShader, fragmentShader } from './resources/shader.ts';

export interface BulletUnit {
  frame: number;
  generation: number;
  direction: THREE.Quaternion;
  position: THREE.Vector3;
  alpha?: number;
}

export default class BulletPool extends THREE.Mesh {
  face: THREE.InstancedBufferGeometry;
  line: THREE.InstancedBufferGeometry;
  rotator: Rotator;
  painter: Painter;
  capacity: number;

  constructor(capacity: number, painter: Painter, model: Model) {
    const material = BulletPool.material();
    const face = BulletPool.geometry(capacity, model.faces);
    const line = BulletPool.geometry(capacity, model.lines);
    super(face, material);
    this.add(new THREE.LineSegments(line, material));

    this.face = face;
    this.line = line;
    this.rotator = model.rotator;
    this.painter = painter;
    this.capacity = capacity;
  }

  setInstances(bullets: BulletUnit[], length: number) {
    length = Math.min(length, this.capacity);
    BulletPool.setInstances(this.face, this.rotator, this.painter.face, bullets, length);
    BulletPool.setInstances(this.line, this.rotator, this.painter.line, bullets, length);
  }

  static geometry(capacity: number, base: THREE.BufferGeometry): THREE.InstancedBufferGeometry {
    function instancedBufferAttribute(n: number): THREE.InstancedBufferAttribute {
      return new THREE.InstancedBufferAttribute(new Float32Array(capacity * n), n, 1);
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.maxInstancedCount = 0;
    geometry.addAttribute('position', base.getAttribute('position'));
    geometry.addAttribute('offset', instancedBufferAttribute(3));
    geometry.addAttribute('orientation', instancedBufferAttribute(4));
    geometry.addAttribute('color', base.getAttribute('color'));
    geometry.addAttribute('color2', instancedBufferAttribute(3));
    geometry.setIndex(base.getIndex());
    return geometry;
  }

  static material(): THREE.RawShaderMaterial {
    return new THREE.RawShaderMaterial({
      uniforms: {},
      vertexShader, fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
  }

  private static readonly tmpQuaternion = new THREE.Quaternion();
  private static readonly tmpColor = new THREE.Color();

  private static setInstances(geometry: THREE.InstancedBufferGeometry, rotator: Rotator, paint: Paint, bullets: BulletUnit[], length: number) {
    const offsets = <THREE.InstancedBufferAttribute> geometry.getAttribute('offset');
    const orientations = <THREE.InstancedBufferAttribute> geometry.getAttribute('orientation');
    const color2s = <THREE.InstancedBufferAttribute> geometry.getAttribute('color2');

    for (let i=0; i<length; ++i) {
      const bullet = bullets[i];
      const orientation = rotator(bullet.frame, bullet.direction, BulletPool.tmpQuaternion);
      const color = paint(bullet.frame, bullet.generation, bullet.position, BulletPool.tmpColor);
      const a = bullet.alpha === undefined ? 1 : bullet.alpha;

      offsets.setXYZ(i, bullet.position.x, bullet.position.y, bullet.position.z);
      orientations.setXYZW(i, orientation.x, orientation.y, orientation.z, orientation.w);
      color2s.setXYZ(i, color.r * a, color.g * a, color.b * a);
    }

    offsets.needsUpdate = true;
    orientations.needsUpdate = true;
    color2s.needsUpdate = true;
    geometry.maxInstancedCount = length;
  }
}
