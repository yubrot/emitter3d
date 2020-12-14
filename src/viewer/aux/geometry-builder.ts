import * as THREE from 'three';

type Point = {
  id: number;
  index: number;
  position: THREE.Vector3;
  color: THREE.Color;
};

export function at(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

export function color(r: number, g: number, b: number): THREE.Color {
  return new THREE.Color(r, g, b);
}

export function center(...positions: THREE.Vector3[]): THREE.Vector3 {
  const v = new THREE.Vector3();
  for (const position of positions) v.add(position);
  return v.divideScalar(positions.length);
}

export class GeometryBuilder extends THREE.Object3D {
  private points: Point[] = [];
  private indices: number[] = [];
  private cache: Map<number, Point[]> = new Map();

  putPoint(position: THREE.Vector3, color: THREE.Color): Point {
    const hash = [position.x, position.y, position.z, color.r, color.g, color.b]
      .sort()
      .reduce((a, b) => a + b, 0);
    const cachedPoints = this.cache.get(hash);
    const cachedPoint =
      cachedPoints && cachedPoints.find(p => p.position.equals(position) && p.color.equals(color));
    if (cachedPoint) return cachedPoint;

    const index = this.points.length;
    const point = { id: this.id, index, position, color };
    this.points.push(point);
    if (cachedPoints) {
      cachedPoints.push(point);
    } else {
      this.cache.set(hash, [point]);
    }
    return point;
  }

  fillTriangleFan(...indices: Point[]): this {
    console.assert(!indices.find(i => i.id != this.id));
    triangleFan(indices, (a, b, c) => this.indices.push(a.index, b.index, c.index));
    return this;
  }

  fillTriangleStrip(...indices: Point[]): this {
    console.assert(!indices.find(i => i.id != this.id));
    triangleStrip(indices, (a, b, c) => this.indices.push(a.index, b.index, c.index));
    return this;
  }

  build(): ObjectGeometry {
    this.updateMatrixWorld(true);

    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const v = new THREE.Vector3();
    let offset = 0;

    this.traverseVisible(g => {
      if (!(g instanceof GeometryBuilder)) return;

      const size = g.points.length;

      positions.length += size * 3;
      colors.length += size * 3;

      g.points.forEach((point, i) => {
        v.copy(point.position).applyMatrix4(g.matrixWorld);
        positions[(offset + i) * 3] = v.x;
        positions[(offset + i) * 3 + 1] = v.y;
        positions[(offset + i) * 3 + 2] = v.z;
        colors[(offset + i) * 3] = point.color.r;
        colors[(offset + i) * 3 + 1] = point.color.g;
        colors[(offset + i) * 3 + 2] = point.color.b;
      });

      indices.push(...g.indices.map(index => index + offset));
      offset += size;
    });

    const position = new THREE.BufferAttribute(new Float32Array(positions), 3);
    const color = new THREE.BufferAttribute(new Float32Array(colors), 3);
    const index = new THREE.BufferAttribute(new Uint16Array(indices), 1);

    return { position, color, index };
  }
}

export type ObjectGeometry = {
  position: THREE.BufferAttribute;
  color: THREE.BufferAttribute;
  index: THREE.BufferAttribute;
};

function triangleFan<T>(ls: T[], handler: (a: T, b: T, c: T) => void): void {
  console.assert(ls.length > 2);
  const a = ls[0];
  let b = ls[1];
  for (let i = 2; i < ls.length; ++i) {
    const c = ls[i];
    handler(a, b, c);
    b = c;
  }
}

function triangleStrip<T>(ls: T[], handler: (a: T, b: T, c: T) => void): void {
  console.assert(ls.length > 2);
  let a = ls[0];
  let b = ls[1];
  for (let i = 2; i < ls.length; ++i) {
    const c = ls[i];
    if (i % 2 == 0) {
      handler(a, b, c);
    } else {
      handler(a, c, b);
    }
    a = b;
    b = c;
  }
}
