import { Painter, Paint } from './resources/painter.ts';
import { Shape, Rotator } from './resources/shape.ts';
import { vertexShader, fragmentShader } from './resources/shader.ts';
import { CommonBullet } from '../simulator/Bullet.ts';

export default class BulletPool extends THREE.Mesh {
  face: THREE.InstancedBufferGeometry;
  line: THREE.InstancedBufferGeometry;
  rotator: Rotator;
  painter: Painter;

  constructor(capacity: number, painter: Painter, shape: Shape) {
    const material = BulletPool.material();
    const face = BulletPool.geometry(capacity, shape.faces);
    const line = BulletPool.geometry(capacity, shape.lines);
    super(face, material);
    this.add(new THREE.LineSegments(line, material));

    this.face = face;
    this.line = line;
    this.rotator = shape.rotator;
    this.painter = painter;
  }

  setInstances(bullets: CommonBullet[]) {
    BulletPool.setInstances(this.face, this.rotator, this.painter.face, bullets);
    BulletPool.setInstances(this.line, this.rotator, this.painter.line, bullets);
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
      depthWrite: false,
    });
  }

  static readonly tmpQuaternion = new THREE.Quaternion();
  static readonly tmpColor = new THREE.Color();

  static setInstances(geometry: THREE.InstancedBufferGeometry, rotator: Rotator, paint: Paint, bullets: CommonBullet[]) {
    const offsets = <THREE.InstancedBufferAttribute> geometry.getAttribute('offset');
    const orientations = <THREE.InstancedBufferAttribute> geometry.getAttribute('orientation');
    const color2s = <THREE.InstancedBufferAttribute> geometry.getAttribute('color2');

    for (let i=0; i<bullets.length; ++i) {
      const bullet = bullets[i];
      const orientation = rotator(bullet.frame, bullet.direction, BulletPool.tmpQuaternion);
      const color = paint(bullet.generation, bullet.position, BulletPool.tmpColor);

      offsets.setXYZ(i, bullet.position.x, bullet.position.y, bullet.position.z);
      orientations.setXYZW(i, orientation.x, orientation.y, orientation.z, orientation.w);
      color2s.setXYZ(i, color.r, color.g, color.b);
    }

    offsets.needsUpdate = true;
    orientations.needsUpdate = true;
    color2s.needsUpdate = true;
    geometry.maxInstancedCount = bullets.length;
  }
}
