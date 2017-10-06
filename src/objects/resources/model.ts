import * as THREE from 'three';

export type Rotator = (frame: number, direction: THREE.Quaternion, dest: THREE.Quaternion) => THREE.Quaternion;

export interface Model {
  rotator: Rotator;
  faces: THREE.BufferGeometry;
  lines: THREE.BufferGeometry;
}

type Point = { face: number, line: number };

class ModelBuilder {
  faceVertices: number[] = [];
  faceVertexColors: number[] = [];
  faceIndices: number[] = [];
  faceIndex: number = 0;
  lineVertices: number[] = [];
  lineVertexColors: number[] = [];
  lineIndices: number[] = [];
  lineIndex: number = 0;

  point(x: number, y: number, z: number, faceColor: THREE.Color, lineColor: THREE.Color): Point {
    const face = this.facePoint(x, y, z, faceColor);
    const line = this.linePoint(x, y, z, lineColor);
    return { face, line };
  }

  facePoint(x: number, y: number, z: number, color: THREE.Color): number {
    this.faceVertices.push(x, y, z);
    this.faceVertexColors.push(color.r, color.g, color.b);
    return this.faceIndex++;
  }

  linePoint(x: number, y: number, z: number, color: THREE.Color): number {
    this.lineVertices.push(x, y, z);
    this.lineVertexColors.push(color.r, color.g, color.b);
    return this.lineIndex++;
  }

  fill(...points: (number | Point)[]) {
    let a = points[0];
    let b = points[1];
    if (typeof a !== 'number') a = a.face;
    if (typeof b !== 'number') b = b.face;
    for (let i=2; i<points.length; ++i) {
      let c = points[i];
      if (typeof c !== 'number') c = c.face;
      this.faceIndices.push(a, b, c);
      b = c;
    }
  }

  line(...points: (number | Point)[]) {
    let l = points[0];
    if (typeof l !== 'number') l = l.line;
    for (let i=1; i<points.length; ++i) {
      let r = points[i];
      if (typeof r !== 'number') r = r.line;
      this.lineIndices.push(l, r);
      l = r;
    }
  }

  segment(...points: (number | Point)[]) {
    let l = points[0];
    if (typeof l !== 'number') l = l.line;
    for (let i=1; i<points.length; ++i) {
      let r = points[i];
      if (typeof r !== 'number') r = r.line;
      this.lineIndices.push(l, r);
    }
  }

  complete(rotator: Rotator): Model {
    const faces = new THREE.BufferGeometry();
    faces.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this.faceVertices), 3));
    faces.addAttribute('color', new THREE.BufferAttribute(new Float32Array(this.faceVertexColors), 3));
    faces.setIndex(new THREE.BufferAttribute(new Uint16Array(this.faceIndices), 1));

    const lines = new THREE.BufferGeometry();
    lines.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this.lineVertices), 3));
    lines.addAttribute('color', new THREE.BufferAttribute(new Float32Array(this.lineVertexColors), 3));
    lines.setIndex(new THREE.BufferAttribute(new Uint16Array(this.lineIndices), 1));

    return { rotator, faces, lines };
  }
}

const white = new THREE.Color(1, 1, 1);
const black = new THREE.Color(0, 0, 0);

function rotation<A>(seg: number, handler: (index: number, rad: number, nextRad: number) => A): A[] {
  const ret: A[] = [];
  for (let i=0; i<seg; ++i) {
    ret.push(handler(i, Math.PI * 2 / seg * i, Math.PI * 2 / seg * (i + 1)));
  }
  return ret;
}

export function missile(num: number, h: number, r: number): Model {
  const b = new ModelBuilder();

  rotation(num * 2, (i, rad, nextRad) => {
    const [c, d, [e1, e2]] = i%2 == 0 ? [0.2, 0.5, [black, white]] : [-0.2, -0.5, [white, black]];
    const faces = [
      b.facePoint(Math.cos(rad)*r, Math.sin(rad)*r, (c+0.3)*h, white),
      b.facePoint(Math.cos(rad)*r, Math.sin(rad)*r, (c-0.3)*h, white),
      b.facePoint(Math.cos(nextRad)*r, Math.sin(nextRad)*r, (c-0.3)*h, white),
      b.facePoint(Math.cos(nextRad)*r, Math.sin(nextRad)*r, (c+0.3)*h, black)
    ];
    b.fill(...faces);
    const lines = [
      b.linePoint(Math.cos(rad)*r, Math.sin(rad)*r, -d*h, e1),
      b.linePoint(Math.cos(rad)*r, Math.sin(rad)*r, d*h, e2),
      b.linePoint(Math.cos(nextRad)*r, Math.sin(nextRad)*r, d*h, e2)
    ];
    b.line(...lines);
  });

  return b.complete((frame, direction, dest) =>
    dest.copy(direction).rotateZ(frame * Math.PI * 0.02));
}

export function arrow(h: number, r: number): Model {
  const b = new ModelBuilder();

  const top = b.point(0, 0, h * 0.3, white, white);
  const segs = rotation(3, (i, rad, nextRad) => b.point(Math.cos(rad) * r, Math.sin(rad) * r, h * -0.2, white, white));
  const bottom = b.linePoint(0, 0, h*-2.2, black);

  b.fill(top, ...segs, segs[0]);
  b.line(...segs, segs[0]);
  b.segment(top, ...segs);
  b.line(top, bottom);

  return b.complete((frame, direction, dest) =>
    dest.copy(direction).rotateZ(frame * Math.PI * 0.01));
}

export function claw(w: number, h: number): Model {
  const b = new ModelBuilder();

  for (let d of [-1, 1]) {
    const points = [
      b.point(d*0.1*w, 0, h*0.7, white, white),
      b.point(d*0.1*w, 0, -h*0.3, white, white),
      b.point(d*0.1*w, w*0.2, 0, white, white),
      b.point(d*0.5*w, 0, 0, white, white),
      b.point(d*0.1*w, -w*0.2, 0, white, white),
    ];
    for (let i=2; i<=4; ++i)
      b.line(points[0], points[i], points[1]);
    b.fill(points[0], ...points.slice(2, 5));
    b.fill(points[1], ...points.slice(2, 5));
  }

  return b.complete((frame, direction, dest) =>
    dest.copy(direction).rotateZ(frame * Math.PI * -0.01));
}
